/*
 The BSD 3-Clause License

 Copyright 2016,2017,2018 - Klaus Landsdorf (http://bianco-royal.de/)
 Copyright 2015,2016 - Mika Karaila, Valmet Automation Inc. (node-red-contrib-opcua)
 All rights reserved.
 node-red-contrib-iiot-opcua
 */
'use strict'

/**
 * Browser Node-RED node.
 *
 * @param RED
 */
module.exports = function (RED) {
  // SOURCE-MAP-REQUIRED
  let coreBrowser = require('./core/opcua-iiot-core-browser')
  let browserEntries = []

  function OPCUAIIoTBrowser (config) {
    RED.nodes.createNode(this, config)
    this.nodeId = config.nodeId
    this.name = config.name
    // this.browseAll = config.browseAll
    this.justValue = config.justValue
    this.sendNodesToRead = config.sendNodesToRead
    this.sendNodesToBrowser = config.sendNodesToBrowser
    this.sendNodesToListener = config.sendNodesToListener
    this.singleBrowseResult = config.singleBrowseResult
    this.showStatusActivities = config.showStatusActivities
    this.showErrors = config.showErrors
    this.connector = RED.nodes.getNode(config.connector)

    let node = this
    node.items = []
    node.browseTopic = coreBrowser.core.OBJECTS_ROOT
    node.opcuaClient = null
    node.opcuaSession = null
    node.reconnectTimeout = 1000

    node.setNodeStatusTo = function (statusValue) {
      let statusParameter = coreBrowser.core.getNodeStatus(statusValue, node.showStatusActivities)
      node.status({fill: statusParameter.fill, shape: statusParameter.shape, text: statusParameter.status})
    }

    node.transformToEntry = function (reference) {
      if (reference) {
        try {
          return reference.toJSON()
        } catch (err) {
          coreBrowser.internalDebugLog(err)

          return {
            referenceTypeId: reference.referenceTypeId.toString(),
            isForward: reference.isForward,
            nodeId: reference.nodeId.toString(),
            browseName: reference.browseName.toString(),
            displayName: reference.displayName,
            nodeClass: reference.nodeClass.toString(),
            typeDefinition: reference.typeDefinition.toString()
          }
        }
      } else {
        coreBrowser.internalDebugLog('Empty Reference On Browse')
      }
    }

    node.browseErrorHandling = function (err, msg) {
      let results = []
      if (err) {
        results.push({
          displayName: {text: 'Objects'},
          nodeId: coreBrowser.core.OBJECTS_ROOT,
          browseName: 'Objects'
        })

        coreBrowser.internalDebugLog('Browser Error ' + err)
        if (node.showErrors) {
          node.error(err, msg)
        }

        if (coreBrowser.core.isSessionBad(err)) {
          node.connector.resetBadSession()
        }
      } else {
        results = browserEntries
        coreBrowser.internalDebugLog('Browse Done With Error: ' + results.length + ' item(s)')
      }

      browserEntries = results
    }

    node.sendMessageBrowserResults = function (msg, browserResult) {
      let nodesToRead = []
      let addressItemList = []

      browserResult.forEach(function (result) {
        result.references.forEach(function (reference) {
          coreBrowser.internalDebugLog('Add Reference To List :' + reference)
          browserEntries.push(node.transformToEntry(reference))
          if (reference.nodeId) {
            nodesToRead.push(reference.nodeId.toString())
            addressItemList.push({ name: reference.browseName.name, nodeId: reference.nodeId.toString(), datatypeName: reference.typeDefinition.toString() })
          }
        })
      })

      node.sendMessage(msg, nodesToRead, addressItemList)
    }

    node.browse = function (session, msg) {
      coreBrowser.internalDebugLog('Browse Topic To Call Browse ' + node.browseTopic)
      browserEntries = []

      coreBrowser.browse(session, node.browseTopic)
        .then(function (browserResult) {
          node.sendMessageBrowserResults(msg, browserResult)
        }).catch(function (err) {
          node.browseErrorHandling(err, msg)
        })
    }

    node.browseNodeList = function (session, msg) {
      browserEntries = []

      if (node.singleBrowseResult) {
        coreBrowser.browseAddressSpaceItems(session, msg.addressSpaceItems)
          .then(function (browserResult) {
            browserEntries = []
            node.sendMessageBrowserResults(msg, browserResult)
          }).catch(function (err) {
            node.browseErrorHandling(err, msg)
          })
      } else {
        msg.addressSpaceItems.map((entry) => (
          coreBrowser.browse(session, entry.nodeId)
            .then(function (browserResult) {
              browserEntries = []
              node.sendMessageBrowserResults(msg, browserResult)
            }).catch(function (err) {
              node.browseErrorHandling(err, msg)
            })))
      }
    }

    node.sendMessage = function (originMessage, nodesToRead, addressItemList) {
      let msg = originMessage
      msg.nodetype = 'browse'

      msg.payload = {
        browserItems: browserEntries
      }

      if (node.browseTopic && node.browseTopic !== '') {
        msg.payload.browseTopic = node.browseTopic
      }

      if (!node.justValue) {
        msg.payload.browserItemsCount = browserEntries.length
        msg.payload.endpoint = node.connector.endpoint
        msg.payload.session = node.opcuaSession.name || 'none'
      }

      if (node.sendNodesToRead && nodesToRead) {
        msg.nodesToRead = nodesToRead
        msg.nodesToReadCount = nodesToRead.length
      }

      if (node.sendNodesToListener && addressItemList) {
        msg.addressItemsToRead = addressItemList
        msg.addressItemsToReadCount = addressItemList.length
      }

      if (node.sendNodesToBrowser && addressItemList) {
        msg.addressItemsToBrowse = addressItemList
        msg.addressItemsToBrowseCount = addressItemList.length
      }

      node.send(msg)
    }

    node.on('input', function (msg) {
      node.browseTopic = node.extractBrowserTopic(msg)

      if (node.connector.stateMachine.getMachineState() !== 'OPEN') {
        coreBrowser.internalDebugLog('Client State Not Open On Browse')
        if (node.showErrors) {
          node.error(new Error('Client Not Open On Browse'), msg)
        }
        return
      }

      if (!node.opcuaSession) {
        node.error(new Error('Session Not Ready To Browse'), msg)
        return
      }

      if (node.browseTopic && node.browseTopic !== '') {
        node.browse(node.opcuaSession, msg)
      } else {
        if (msg.addressItemsToBrowse) {
          msg.addressSpaceItems = msg.addressItemsToBrowse
        }

        if (msg.addressSpaceItems) {
          node.browseNodeList(node.opcuaSession, msg)
        } else {
          node.error(new Error('No AddressSpace Items Or Root To Browse'), msg)
        }
      }
    })

    node.extractBrowserTopic = function (msg) {
      let rootNodeId

      if (msg.payload.actiontype === 'browse') { // event driven browsing
        if (msg.payload.root && msg.payload.root.nodeId) {
          coreBrowser.internalDebugLog('Root Selected External ' + msg.payload.root)
          rootNodeId = node.browseByItem(msg.payload.root.nodeId) || node.browseToRoot()
        } else {
          rootNodeId = node.nodeId || node.browseToRoot()
        }
      } else {
        if (msg.topic !== '' && msg.topic.includes('=')) {
          rootNodeId = msg.topic // backward compatibles to v0.x
        } else {
          rootNodeId = node.nodeId
        }
      }

      return rootNodeId
    }

    node.browseByItem = function (nodeId) {
      coreBrowser.detailDebugLog('Browse To Parent ' + nodeId)
      return nodeId
    }

    node.browseToRoot = function () {
      coreBrowser.detailDebugLog('Browse To Root ' + coreBrowser.core.OBJECTS_ROOT)
      return coreBrowser.core.OBJECTS_ROOT
    }

    node.setOPCUAConnected = function (opcuaClient) {
      node.opcuaClient = opcuaClient
      node.setNodeStatusTo('connected')
    }

    node.opcuaSessionStarted = function (opcuaSession) {
      node.opcuaSession = opcuaSession
      node.setNodeStatusTo('active')
    }

    node.connectorShutdown = function (opcuaClient) {
      coreBrowser.internalDebugLog('Connector Shutdown')
      if (opcuaClient) {
        node.opcuaClient = opcuaClient
      }
    }

    if (node.connector) {
      node.connector.on('connected', node.setOPCUAConnected)
      node.connector.on('session_started', node.opcuaSessionStarted)
      node.connector.on('after_reconnection', node.connectorShutdown)
    } else {
      throw new TypeError('Connector Not Valid')
    }

    coreBrowser.core.setNodeInitalState(node.connector.stateMachine.getMachineState(), node)
  }

  RED.nodes.registerType('OPCUA-IIoT-Browser', OPCUAIIoTBrowser)

  RED.httpAdmin.get('/opcuaIIoT/browse/:id/:nodeId', RED.auth.needsPermission('opcuaIIoT.browse'), function (req, res) {
    let node = RED.nodes.getNode(req.params.id)
    let entries = []
    let nodeRootId = decodeURIComponent(req.params.nodeId) || coreBrowser.core.OBJECTS_ROOT

    if (node.opcuaSession) {
      coreBrowser.browse(node.opcuaSession, nodeRootId).then(function (browserResult) {
        browserResult.browseResult.forEach(function (result) {
          if (result.references && result.references.length) {
            result.references.forEach(function (reference) {
              entries.push(node.transformToEntry(reference))
            })
          } else {
            coreBrowser.detailDebugLog(JSON.stringify(result))
          }
        })
        res.json(entries)
        browserEntries = entries
      }).catch(function (err) {
        coreBrowser.internalDebugLog('Browser Error ' + err)
        if (node.showErrors) {
          node.error(err, {payload: 'Browse Internal Error'})
        }

        entries.push({
          displayName: {text: 'Objects'},
          nodeId: coreBrowser.core.OBJECTS_ROOT,
          browseName: 'Objects'
        })
        res.json(entries)
        browserEntries = entries
      })
    } else {
      res.json(entries)
      browserEntries = entries
    }
  })
}
