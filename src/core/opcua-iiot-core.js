/**
 The BSD 3-Clause License

 Copyright 2016,2017,2018 - Klaus Landsdorf (http://bianco-royal.de/)
 Copyright 2015,2016 - Mika Karaila, Valmet Automation Inc. (node-red-contrib-opcua)
 All rights reserved.
 node-red-contrib-iiot-opcua
 */
'use strict'
// SOURCE-MAP-REQUIRED

/**
 * Nested namespace settings.
 *
 * @type {{biancoroyal: {opcua: {iiot: {core: {}}}}}}
 *
 * @Namesapce de.biancoroyal.opcua.iiot.core
 */
var de = de || {biancoroyal: {opcua: {iiot: {core: {}}}}} // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.nodeOPCUA = de.biancoroyal.opcua.iiot.core.nodeOPCUA || require('node-opcua') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.nodeOPCUAId = de.biancoroyal.opcua.iiot.core.nodeOPCUAId || require('node-opcua-nodeid') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.internalDebugLog = de.biancoroyal.opcua.iiot.core.internalDebugLog || require('debug')('opcuaIIoT:core') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.detailDebugLog = de.biancoroyal.opcua.iiot.core.detailDebugLog || require('debug')('opcuaIIoT:core:details') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.specialDebugLog = de.biancoroyal.opcua.iiot.core.specialDebugLog || require('debug')('opcuaIIoT:core:special') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.OBJECTS_ROOT = de.biancoroyal.opcua.iiot.core.OBJECTS_ROOT || 'ns=0;i=84' // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.TEN_SECONDS_TIMEOUT = de.biancoroyal.opcua.iiot.core.TEN_SECONDS_TIMEOUT || 10 // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.os = de.biancoroyal.opcua.iiot.core.os || require('os') // eslint-disable-line no-use-before-define
de.biancoroyal.opcua.iiot.core.isWindows = de.biancoroyal.opcua.iiot.core.isWindows || /^win/.test(de.biancoroyal.opcua.iiot.core.os.platform()) // eslint-disable-line no-use-before-define

de.biancoroyal.opcua.iiot.core.internalDebugLog(de.biancoroyal.opcua.iiot.core.os.endianness())
de.biancoroyal.opcua.iiot.core.internalDebugLog(de.biancoroyal.opcua.iiot.core.os.hostname())
de.biancoroyal.opcua.iiot.core.internalDebugLog(de.biancoroyal.opcua.iiot.core.os.platform())
de.biancoroyal.opcua.iiot.core.internalDebugLog(de.biancoroyal.opcua.iiot.core.os.type())
de.biancoroyal.opcua.iiot.core.internalDebugLog(de.biancoroyal.opcua.iiot.core.os.arch())

de.biancoroyal.opcua.iiot.core.getPathFromRequireResolve = function (requireResolve) {
  let pathToNodeOPCUA = ''

  if (this.isWindows) {
    pathToNodeOPCUA = requireResolve.replace('\\index.js', '')
  } else {
    pathToNodeOPCUA = requireResolve.replace('/index.js', '')
  }

  this.internalDebugLog('path to node-opcua: ' + pathToNodeOPCUA)

  return pathToNodeOPCUA
}

de.biancoroyal.opcua.iiot.core.getNodeOPCUAPath = function () {
  return this.getPathFromRequireResolve(require.resolve('node-opcua'))
}

de.biancoroyal.opcua.iiot.core.getNodeOPCUAClientPath = function () {
  return this.getPathFromRequireResolve(require.resolve('node-opcua-client'))
}

de.biancoroyal.opcua.iiot.core.getNodeOPCUAServerPath = function () {
  return this.getPathFromRequireResolve(require.resolve('node-opcua-server'))
}

de.biancoroyal.opcua.iiot.core.getTimeUnitName = function (unit) {
  let unitAbbreviation = ''

  switch (unit) {
    case 'ms':
      unitAbbreviation = 'msec.'
      break
    case 's':
      unitAbbreviation = 'sec.'
      break
    case 'm':
      unitAbbreviation = 'min.'
      break
    case 'h':
      unitAbbreviation = 'h.'
      break
    default:
      break
  }

  return unitAbbreviation
}

de.biancoroyal.opcua.iiot.core.calcMillisecondsByTimeAndUnit = function (time, unit) {
  let convertedTime

  switch (unit) {
    case 'ms':
      convertedTime = time
      break
    case 's':
      convertedTime = time * 1000 // seconds
      break
    case 'm':
      convertedTime = time * 60000 // minutes
      break
    case 'h':
      convertedTime = time * 3600000 // hours
      break
    default:
      convertedTime = 10000 // 10 sec.
      break
  }

  return convertedTime
}

de.biancoroyal.opcua.iiot.core.buildBrowseMessage = function (topic) {
  return {
    'topic': topic,
    'nodeId': '',
    'browseName': '',
    'nodeClassType': '',
    'typeDefinition': '',
    'payload': ''
  }
}

de.biancoroyal.opcua.iiot.core.toInt32 = function (x) {
  let uintSixteen = x

  if (uintSixteen >= Math.pow(2, 15)) {
    uintSixteen = x - Math.pow(2, 16)
    return uintSixteen
  } else {
    return uintSixteen
  }
}

de.biancoroyal.opcua.iiot.core.getNodeStatus = function (statusValue, statusLog) {
  let fillValue = 'yellow'
  let shapeValue = 'ring'

  switch (statusValue) {
    case 'initialize':
    case 'connecting':
      fillValue = 'yellow'
      break
    case 'connected':
    case 'keepalive':
    case 'subscribe':
    case 'started':
      if (!statusLog) {
        statusValue = 'active'
        shapeValue = 'dot'
      }
      fillValue = 'green'
      break
    case 'active':
    case 'subscribed':
    case 'listening':
      fillValue = 'green'
      shapeValue = 'dot'
      break
    case 'disconnected':
    case 'terminated':
      fillValue = 'red'
      break
    case 'waiting':
      fillValue = 'blue'
      shapeValue = 'dot'
      statusValue = 'waiting ...'
      break
    case 'error':
      fillValue = 'red'
      shapeValue = 'dot'
      break
    default:
      if (!statusValue) {
        fillValue = 'blue'
        statusValue = 'waiting ...'
      }
  }

  return {fill: fillValue, shape: shapeValue, status: statusValue}
}

de.biancoroyal.opcua.iiot.core.buildNewVariant = function (datatype, value) {
  let opcua = de.biancoroyal.opcua.iiot.core.nodeOPCUA
  let variantValue = null

  this.detailDebugLog('buildNewVariant datatype: ' + datatype + ' value:' + value)

  switch (datatype) {
    case 'Float':
    case opcua.DataType.Float:
      variantValue = {
        dataType: opcua.DataType.Float,
        value: parseFloat(value)
      }
      break
    case 'Double':
    case opcua.DataType.Double:
      variantValue = {
        dataType: opcua.DataType.Double,
        value: parseFloat(value)
      }
      break
    case 'UInt16':
    case opcua.DataType.UInt16:
      let uint16 = new Uint16Array([value])
      variantValue = {
        dataType: opcua.DataType.UInt16,
        value: uint16[0]
      }
      break
    case 'UInt32':
    case opcua.DataType.UInt32:
      let uint32 = new Uint32Array([value])
      variantValue = {
        dataType: opcua.DataType.UInt32,
        value: uint32[0]
      }
      break
    case 'Int32':
    case opcua.DataType.Int32:
      variantValue = {
        dataType: opcua.DataType.Int32,
        value: parseInt(value)
      }
      break
    case 'Int16':
    case opcua.DataType.Int16:
      variantValue = {
        dataType: opcua.DataType.Int16,
        value: parseInt(value)
      }
      break
    case 'Int64':
    case opcua.DataType.Int64:
      variantValue = {
        dataType: opcua.DataType.Int64,
        value: parseInt(value)
      }
      break
    case 'Boolean':
    case opcua.DataType.Boolean:
      if (value && value !== 'false') {
        variantValue = {
          dataType: opcua.DataType.Boolean,
          value: true
        }
      } else {
        variantValue = {
          dataType: opcua.DataType.Boolean,
          value: false
        }
      }
      break
    case 'LocalizedText':
    case opcua.DataType.LocalizedText:
      variantValue = {
        dataType: opcua.DataType.LocalizedText,
        value: JSON.parse(value) /* [{text:'Hello', locale:'en'}, {text:'Hallo', locale:'de'} ... ] */
      }
      break
    case 'DateTime':
    case opcua.DataType.DateTime:
      variantValue = {
        dataType: opcua.DataType.DateTime,
        value: new Date(value)
      }
      break
    default:
      variantValue = {
        dataType: opcua.DataType.String,
        value: value
      }
      break
  }

  this.detailDebugLog('buildNewVariant variantValue: ' + JSON.stringify(variantValue))

  return variantValue
}

de.biancoroyal.opcua.iiot.core.getVariantValue = function (datatype, value) {
  let opcua = de.biancoroyal.opcua.iiot.core.nodeOPCUA

  switch (datatype) {
    case 'Float':
    case 'Double':
    case opcua.DataType.Double:
      return parseFloat(value)
    case 'UInt16':
    case opcua.DataType.UInt16:
      let uint16 = new Uint16Array([value])
      return uint16[0]
    case 'UInt32':
    case opcua.DataType.UInt32:
      let uint32 = new Uint32Array([value])
      return uint32[0]
    case 'Int16':
    case opcua.DataType.Int16:
    case 'Int32':
    case 'Integer':
    case opcua.DataType.Int32:
    case 'Int64':
    case opcua.DataType.Int64:
      return parseInt(value)
    case 'Boolean':
    case opcua.DataType.Boolean:
      return (value && value !== 'false')
    case 'DateTime':
    case opcua.DataType.DateTime:
      return new Date(value)
    case 'String':
    case opcua.DataType.String:
      return (typeof value !== 'string') ? value.toString() : value
    default:
      return value
  }
}

de.biancoroyal.opcua.iiot.core.getBasicDataTypes = function () {
  let opcua = de.biancoroyal.opcua.iiot.core.nodeOPCUA

  return [
    {name: 'Null', dataType: opcua.DataType.Null},
    {name: 'Boolean', dataType: opcua.DataType.Boolean},
    {name: 'SByte', dataType: opcua.DataType.SByte},
    {name: 'Byte', dataType: opcua.DataType.Byte},
    {name: 'Int16', dataType: opcua.DataType.Int16},
    {name: 'UInt16', dataType: opcua.DataType.UInt16},
    {name: 'Int32', dataType: opcua.DataType.Int32},
    {name: 'UInt32', dataType: opcua.DataType.UInt32},
    {name: 'Int64', dataType: opcua.DataType.Int64},
    {name: 'UInt64', dataType: opcua.DataType.UInt64},
    {name: 'Float', dataType: opcua.DataType.Float},
    {name: 'Double', dataType: opcua.DataType.Double},
    {name: 'DateTime', dataType: opcua.DataType.DateTime},
    {name: 'String', dataType: opcua.DataType.String},
    {name: 'Guid', dataType: opcua.DataType.Guid},
    {name: 'ByteString', dataType: opcua.DataType.ByteString},
    {name: 'XmlElement', dataType: opcua.DataType.XmlElement},
    {name: 'NodeId', dataType: opcua.DataType.NodeId},
    {name: 'ExpandedNodeId', dataType: opcua.DataType.ExpandedNodeId},
    {name: 'StatusCode', dataType: opcua.DataType.StatusCode},
    {name: 'LocalizedText', dataType: opcua.DataType.LocalizedText},
    {name: 'ExtensionObject', dataType: opcua.DataType.ExtensionObject},
    {name: 'DataValue', dataType: opcua.DataType.DataValue},
    {name: 'Variant', dataType: opcua.DataType.Variant},
    {name: 'DiagnosticInfo', dataType: opcua.DataType.DiagnosticInfo}
  ]
}

de.biancoroyal.opcua.iiot.core.convertDataValue = function (value) {
  return de.biancoroyal.opcua.iiot.core.convertDataValueByDataType(value, value.dataType)
}

de.biancoroyal.opcua.iiot.core.convertDataValueByDataType = function (value, dataType) {
  let opcua = de.biancoroyal.opcua.iiot.core.nodeOPCUA
  let convertedValue = null

  if (!value.hasOwnProperty('value')) {
    this.specialDebugLog('value has no value and that is not allowed ' + JSON.stringify(value))
    return value
  }

  let valueType = typeof value.value

  this.detailDebugLog('convertDataValue: ' + JSON.stringify(value) +
    ' value origin type ' + valueType + ' convert to' + ' ' + dataType)

  try {
    switch (dataType) {
      case 'NodeId':
      case opcua.DataType.NodeId:
        convertedValue = value.value.toString()
        break
      case 'NodeIdType':
      case opcua.DataType.NodeIdType:
        if (value.value instanceof Buffer) {
          convertedValue = value.value.toString()
        } else {
          convertedValue = value.value
        }
        break
      case 'ByteString':
      case opcua.DataType.ByteString:
        convertedValue = value.value
        break
      case 'Byte':
      case opcua.DataType.Byte:
        if (valueType === 'boolean') {
          convertedValue = value.value ? 1 : 0
        } else {
          convertedValue = parseInt(value.value)
        }
        break
      case opcua.DataType.QualifiedName:
        convertedValue = value.value.toString()
        break
      case 'LocalizedText':
      case opcua.DataType.LocalizedText:
        convertedValue = value.value
        break
      case 'Float':
      case opcua.DataType.Float:
        if (isNaN(value.value)) {
          convertedValue = value.value
        } else {
          convertedValue = parseFloat(value.value)
        }
        break
      case 'Double':
      case opcua.DataType.Double:
        if (isNaN(value.value)) {
          convertedValue = value.value
        } else {
          convertedValue = parseFloat(value.value)
        }
        break
      case 'UInt16':
      case opcua.DataType.UInt16:
        let uint16 = new Uint16Array([value.value])
        convertedValue = uint16[0]
        break
      case 'UInt32':
      case opcua.DataType.UInt32:
        let uint32 = new Uint32Array([value.value])
        convertedValue = uint32[0]
        break
      case 'Int16':
      case opcua.DataType.Int16:
      case 'Int32':
      case opcua.DataType.Int32:
      case 'Int64':
      case opcua.DataType.Int64:
        if (valueType === 'boolean') {
          convertedValue = value.value ? 1 : 0
        } else {
          if (isNaN(value.value)) {
            convertedValue = value.value
          } else {
            convertedValue = parseInt(value.value)
          }
        }
        break
      case 'Boolean':
      case opcua.DataType.Boolean:
        if (valueType === 'boolean') {
          convertedValue = value.value
        } else {
          if (isNaN(value.value)) {
            convertedValue = (value.value && value.value.toString().toLowerCase() !== 'false')
          } else {
            convertedValue = (value.value)
          }
        }
        break
      case 'String':
      case opcua.DataType.String:
        if (valueType !== 'string') {
          convertedValue = value.value.toString()
        } else {
          convertedValue = value.value
        }
        break
      case 'Null':
      case opcua.DataType.Null:
        convertedValue = null
        break
      default:
        this.internalDebugLog('convertDataValue unused DataType: ' + dataType)
        if (value.hasOwnProperty('value')) {
          convertedValue = value.value
        } else {
          convertedValue = null
        }
        break
    }
  } catch (err) {
    this.detailDebugLog('convertDataValue ' + err)
  }

  this.detailDebugLog('convertDataValue is: ' + convertedValue)

  return convertedValue
}

de.biancoroyal.opcua.iiot.core.regex_ns_i = /ns=([0-9]+);i=([0-9]+)/
de.biancoroyal.opcua.iiot.core.regex_ns_s = /ns=([0-9]+);s=(.*)/
de.biancoroyal.opcua.iiot.core.regex_ns_b = /ns=([0-9]+);b=(.*)/
de.biancoroyal.opcua.iiot.core.regex_ns_g = /ns=([0-9]+);g=(.*)/

de.biancoroyal.opcua.iiot.core.parseNamspaceFromMsgTopic = function (msg) {
  let nodeNamespace = null

  if (msg && msg.topic) {
    // TODO: real parsing instead of string operations
    // TODO: which type are relevant here? (String, Integer ...)
    nodeNamespace = msg.topic.substring(3, msg.topic.indexOf(';'))
  }

  return nodeNamespace
}

de.biancoroyal.opcua.iiot.core.parseNamspaceFromItemNodeId = function (item) {
  let nodeNamespace = null
  let nodeItem = item.nodeId || item

  if (nodeItem) {
    // TODO: real parsing instead of string operations
    // TODO: which type are relevant here? (String, Integer ...)
    nodeNamespace = nodeItem.substring(3, nodeItem.indexOf(';'))
  }

  return nodeNamespace
}

de.biancoroyal.opcua.iiot.core.parseIdentifierFromMsgTopic = function (msg) {
  let nodeIdentifier = null

  if (msg && msg.topic) {
    // TODO: real parsing instead of string operations
    if (msg.topic.toString().includes(';i=')) {
      nodeIdentifier = {
        identifier: parseInt(msg.topic.substring(msg.topic.indexOf(';i=') + 3)),
        type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.NUMERIC
      }
    } else {
      if (msg.topic.toString().includes(';b=')) {
        nodeIdentifier = {
          identifier: msg.topic.substring(msg.topic.indexOf(';b=') + 3),
          type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.BYTESTRING
        }
      } else {
        nodeIdentifier = {
          identifier: msg.topic.substring(msg.topic.indexOf(';s=') + 3),
          type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.STRING
        }
      }
    }
  }

  return nodeIdentifier
}

de.biancoroyal.opcua.iiot.core.parseIdentifierFromItemNodeId = function (item) {
  let nodeIdentifier = null
  let nodeItem = item.nodeId || item

  if (nodeItem) {
    // TODO: real parsing instead of string operations
    if (nodeItem.includes(';i=')) {
      nodeIdentifier = {
        identifier: parseInt(nodeItem.substring(nodeItem.indexOf(';i=') + 3)),
        type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.NUMERIC
      }
    } else {
      if (nodeItem.includes(';b=')) {
        nodeIdentifier = {
          identifier: nodeItem.substring(nodeItem.indexOf(';b=') + 3),
          type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.STRING
        }
      } else {
        nodeIdentifier = {
          identifier: nodeItem.substring(nodeItem.indexOf(';s=') + 3),
          type: de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeIdType.STRING
        }
      }
    }
  }

  return nodeIdentifier
}

de.biancoroyal.opcua.iiot.core.newOPCUANodeIdFromItemNodeId = function (item) {
  let namespace = de.biancoroyal.opcua.iiot.core.parseNamspaceFromItemNodeId(item)
  let nodeIdentifier = de.biancoroyal.opcua.iiot.core.parseIdentifierFromItemNodeId(item)

  this.internalDebugLog('newOPCUANodeIdFromItemNodeId: ' + JSON.stringify(item) + ' -> ' + JSON.stringify(nodeIdentifier) + ' namespace:' + namespace)
  return new de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeId(nodeIdentifier.type, nodeIdentifier.identifier, namespace)
}

de.biancoroyal.opcua.iiot.core.newOPCUANodeIdFromMsgTopic = function (msg) {
  let namespace = de.biancoroyal.opcua.iiot.core.parseNamspaceFromMsgTopic(msg)
  let nodeIdentifier = de.biancoroyal.opcua.iiot.core.parseIdentifierFromMsgTopic(msg)

  this.internalDebugLog('newOPCUANodeIdFromMsgTopic: ' + JSON.stringify(nodeIdentifier))
  return new de.biancoroyal.opcua.iiot.core.nodeOPCUAId.NodeId(nodeIdentifier.type, nodeIdentifier.identifier, namespace)
}

de.biancoroyal.opcua.iiot.core.buildNodesToWrite = function (msg) {
  let opcua = de.biancoroyal.opcua.iiot.core.nodeOPCUA
  let nodesToWrite = []

  this.detailDebugLog('buildNodesToWrite input: ' + JSON.stringify(msg))
  let item = null

  // compatible mode to nodesToWrite of node-opcua
  if (!msg.addressSpaceItems || !msg.addressSpaceItems.length) {
    let itemList = msg.payload.nodesToWrite || msg.nodesToWrite
    if (itemList && itemList.length) {
      msg.addressSpaceItems = itemList
    }
  }

  if (msg.addressSpaceItems) {
    let index = 0
    if (msg.valuesToWrite) {
      for (item of msg.addressSpaceItems) {
        nodesToWrite.push({
          nodeId: this.newOPCUANodeIdFromItemNodeId(item),
          attributeId: opcua.AttributeIds.Value,
          indexRange: null,
          value: {value: this.buildNewVariant(item.datatypeName, msg.valuesToWrite[index++])}
        })
      }
    } else {
      for (item of msg.addressSpaceItems) {
        if (item.value) {
          nodesToWrite.push({
            nodeId: this.newOPCUANodeIdFromItemNodeId(item),
            attributeId: opcua.AttributeIds.Value,
            indexRange: null,
            value: {value: this.buildNewVariant(item.datatypeName, item.value)}
          })
        } else {
          nodesToWrite.push({
            nodeId: this.newOPCUANodeIdFromItemNodeId(item),
            attributeId: opcua.AttributeIds.Value,
            indexRange: null,
            value: {value: this.buildNewVariant(item.datatypeName, (msg.payload.length && msg.payload.length === msg.addressSpaceItems.length) ? msg.payload[index++] : msg.payload)}
          })
        }
      }
    }
  }

  this.internalDebugLog('buildNodesToWrite output: ' + JSON.stringify(nodesToWrite))

  return nodesToWrite
}

de.biancoroyal.opcua.iiot.core.buildNodesToRead = function (msg) {
  let nodesToRead = []
  let item = null

  this.detailDebugLog('buildNodesToRead input: ' + JSON.stringify(msg))

  let nodePayloadList = msg.payload.nodesToRead || msg.payload.nodesToWrite
  if (nodePayloadList && nodePayloadList.length) {
    // read to read
    for (item of nodePayloadList) {
      item = item.nodeId || item
      nodesToRead.push(item.toString())
    }
  } else {
    let nodeList = msg.nodesToRead || msg.nodesToWrite
    if (nodeList && nodeList.length) {
      // legacy
      for (item of nodeList) {
        item = item.nodeId || item
        nodesToRead.push(item.toString())
      }
    } else {
      // new structure
      if (msg.payload.addressSpaceItems && msg.payload.addressSpaceItems.length) {
        for (item of msg.payload.addressSpaceItems) {
          nodesToRead.push(item.nodeId)
        }
      } else {
        if (msg.addressSpaceItems && msg.addressSpaceItems.length) {
          for (item of msg.addressSpaceItems) {
            nodesToRead.push(item.nodeId)
          }
        }
      }
    }
  }

  this.internalDebugLog('buildNodesToRead output: ' + JSON.stringify(nodesToRead))

  return nodesToRead
}

de.biancoroyal.opcua.iiot.core.buildNodesToListen = function (msg) {
  return msg.addressItemsToRead || msg.addressSpaceItems
}

de.biancoroyal.opcua.iiot.core.availableMemory = function () {
  return this.os.freemem() / this.os.totalmem() * 100.0
}

de.biancoroyal.opcua.iiot.core.isSessionBad = function (err) {
  return (err.toString().includes('BadSession') || err.toString().includes('Invalid Channel'))
}

de.biancoroyal.opcua.iiot.core.setNodeInitalState = function (nodeState, node) {
  switch (nodeState) {
    case 'INIT':
      node.setNodeStatusTo('connecting')
      break
    case 'OPEN':
      node.opcuaSession = node.connector.opcuaSession
      node.setNodeStatusTo('active')
      break
    case 'LOCKED':
      node.setNodeStatusTo('locked')
      break
    case 'UNLOCKED':
      node.setNodeStatusTo('unlocked')
      break
    default:
      node.setNodeStatusTo('waiting')
  }
}

de.biancoroyal.opcua.iiot.core.isNodeId = function (nodeId) {
  if (!nodeId || !nodeId.identifierType) {
    return false
  }

  switch (nodeId.identifierType) {
    case this.nodeOPCUA.NodeIdType.NUMERIC:
    case this.nodeOPCUA.NodeIdType.STRING:
    case this.nodeOPCUA.NodeIdType.GUID:
      return true
    default:
      return false
  }
}

module.exports = de.biancoroyal.opcua.iiot.core
