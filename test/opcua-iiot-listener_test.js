/**
 * Original Work Copyright 2014 IBM Corp.
 * node-red
 *
 * Copyright (c) 2018 Klaus Landsdorf (http://bianco-royal.de/)
 * All rights reserved.
 * node-red-contrib-iiot-opcua
 *
 **/

'use strict'

var assert = require('chai').assert

// iiot opc ua nodes
var injectNode = require('../src/opcua-iiot-inject')
var serverNode = require('../src/opcua-iiot-server')
var connectorNode = require('../src/opcua-iiot-connector')
var inputNode = require('../src/opcua-iiot-listener')
var helper = require('node-red-contrib-test-helper')

var listenerNodesToLoad = [injectNode, connectorNode, inputNode, serverNode]

var testListenerMonitoringFlow = [
  {
    "id": "n1li",
    "type": "OPCUA-IIoT-Inject",
    "injectType": "listen",
    "payload": "{ \"interval\": 500, \"queueSize\": 1 }",
    "payloadType": "json",
    "topic": "TestTopicListen",
    "repeat": "",
    "crontab": "",
    "once": true,
    "startDelay": "2.4",
    "name": "Start Abo",
    "addressSpaceItems": [
      {
        "name": "FullCounter",
        "nodeId": "ns=4;s=FullCounter",
        "datatypeName": ""
      }
    ],
    "wires": [
      [
        "n2li", "n3li"
      ]
    ]
  },
  {
    "id": "usli",
    "type": "OPCUA-IIoT-Inject",
    "injectType": "listen",
    "payload": "unsubscribe",
    "payloadType": "str",
    "topic": "TestTopicUnsubscribe",
    "repeat": "",
    "crontab": "",
    "once": true,
    "startDelay": "5.5",
    "name": "Stop Abo",
    "addressSpaceItems": [
      {
        "name": "FullCounter",
        "nodeId": "ns=4;s=FullCounter",
        "datatypeName": ""
      }
    ],
    "wires": [
      [
        "n2li", "n3li"
      ]
    ]
  },
  {id:"n2li", type:"helper"},
  {
    "id": "n3li",
    "type": "OPCUA-IIoT-Listener",
    "connector": "c1li",
    "action": "subscribe",
    "queueSize": 1,
    "name": "",
    "justValue": true,
    "showStatusActivities": false,
    "showErrors": false,
    "wires": [
      [
        "n4li"
      ]
    ]
  },
  {
    "id": "c1li",
    "type": "OPCUA-IIoT-Connector",
    "z": "",
    "discoveryUrl": "",
    "endpoint": "opc.tcp://localhost:1985",
    "keepSessionAlive": false,
    "loginEnabled": false,
    "securityPolicy": "None",
    "securityMode": "NONE",
    "name": "LOCAL DEMO SERVER",
    "showErrors": false,
    "publicCertificateFile": "",
    "privateKeyFile": "",
    "defaultSecureTokenLifetime": "60000",
    "endpointMustExist": false,
    "autoSelectRightEndpoint": false,
    "strategyMaxRetry": "",
    "strategyInitialDelay": "",
    "strategyMaxDelay": "",
    "strategyRandomisationFactor": ""
  },
  {id:"n4li", type:"helper"},
  {
    "id": "s1li",
    "type": "OPCUA-IIoT-Server",
    "port": "1985",
    "endpoint": "",
    "acceptExternalCommands": true,
    "maxAllowedSessionNumber": "",
    "maxConnectionsPerEndpoint": "",
    "maxAllowedSubscriptionNumber": "",
    "alternateHostname": "",
    "name": "TestServer",
    "showStatusActivities": false,
    "showErrors": false,
    "asoDemo": true,
    "allowAnonymous": true,
    "isAuditing": false,
    "serverDiscovery": true,
    "users": [],
    "xmlsets": [],
    "publicCertificateFile": "",
    "privateCertificateFile": "",
    "maxNodesPerRead": 1000,
    "maxNodesPerBrowse": 2000,
    "wires": [[]]
  }
]

describe('OPC UA Listener monitoring node Testing', function () {
  beforeEach(function(done) {
    helper.startServer(function () {
      done()
    })
  })

  afterEach(function(done) {
    helper.unload().then(function () {
      helper.stopServer(function () {
        done()
      })
    }).catch(function (err) {
      console.log('events error ' + err)
      helper.stopServer(function () {
        done()
      })
    })
  })

  describe('Listen node', function () {

    let msgCounter = 0

    it('should be loaded', function (done) {
      helper.load([inputNode, connectorNode], [
          {
            "id": "bee3e3b0.ca1a08",
            "type": "OPCUA-IIoT-Listener",
            "connector": "c30aa44e.9ed95",
            "action": "subscribe",
            "queueSize": 10,
            "name": "TestListener",
            "justValue": true,
            "showStatusActivities": false,
            "showErrors": false,
            "wires": [
              [
                "3497534.af772ac"
              ]
            ]
          },
          {
            "id": "c30aa44e.9ed95",
            "type": "OPCUA-IIoT-Connector",
            "discoveryUrl": "",
            "endpoint": "opc.tcp://localhost:2000/",
            "keepSessionAlive": false,
            "loginEnabled": false,
            "securityPolicy": "None",
            "securityMode": "NONE",
            "name": "TESTSERVER",
            "showStatusActivities": false,
            "showErrors": false,
            "publicCertificateFile": "",
            "privateKeyFile": "",
            "defaultSecureTokenLifetime": "60000",
            "endpointMustExist": false,
            "autoSelectRightEndpoint": false
          }
        ],
        function () {
          let nodeUnderTest = helper.getNode('bee3e3b0.ca1a08')
          nodeUnderTest.should.have.property('name', 'TestListener')
          nodeUnderTest.should.have.property('action', 'subscribe')
          done()
        })
    })

    it('should get a message with payload after inject on subscribe', function(done) {

      helper.load(listenerNodesToLoad, testListenerMonitoringFlow, function() {
        msgCounter = 0
        let n2 = helper.getNode("n2li")
        n2.on("input", function(msg) {
          msgCounter++
          if(msgCounter === 1) {
            msg.should.have.property('topic', 'TestTopicListen')
            msg.should.have.property('nodetype', 'inject')
            msg.should.have.property('injectType', 'listen')
            setTimeout(done, 2000)
          }
        })
      })
    })

    it('should verify a message on changed monitored item with statusCode on subscribe', function(done) {

      helper.load(listenerNodesToLoad, testListenerMonitoringFlow, function() {
        msgCounter = 0
        let n4 = helper.getNode("n4li")
        n4.on("input", function(msg) {
          msgCounter++
          if(msgCounter === 1) {
            msg.payload.value.should.have.property('dataType', 'Int32')
            msg.payload.should.have.property('statusCode')
            done()
          }
        })
      })
    })

    it('should get a message with payload after inject on unsubscribe', function(done) {

      helper.load(listenerNodesToLoad, testListenerMonitoringFlow, function() {
        msgCounter = 0
        let n2 = helper.getNode("n2li")
        n2.on("input", function(msg) {
          msgCounter++
          if(msgCounter === 2) {
            msg.should.have.property('topic', 'TestTopicUnsubscribe')
            msg.should.have.property('nodetype', 'inject')
            msg.should.have.property('injectType', 'listen')
            setTimeout(done, 2000)
          }
        })
      })
    })

    it('should get a message with payload options after inject on unsubscribe', function(done) {

      helper.load(listenerNodesToLoad, testListenerMonitoringFlow, function() {
        msgCounter = 0
        let n2 = helper.getNode("n2li")
        n2.on("input", function(msg) {
          msgCounter++
          if(msgCounter === 2) {
            msg.should.have.property('topic', 'TestTopicUnsubscribe')
            msg.should.have.property('payload', 'unsubscribe')
            setTimeout(done, 2000)
          }
        })
      })
    })
  })
})
