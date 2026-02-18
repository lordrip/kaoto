export interface SampleRoute {
  name: string;
  filename: string;
  content: string;
}

export const sampleRoutes: SampleRoute[] = [
  {
    name: 'Timer to Log',
    filename: 'timer-to-log.camel.yaml',
    content: `- route:
    id: timer-to-log
    from:
      uri: timer:hello
      parameters:
        period: "1000"
      steps:
        - setBody:
            simple: "Hello from Kaoto Web!"
        - log:
            message: "\${body}"
`,
  },
  {
    name: 'REST to Direct',
    filename: 'rest-to-direct.camel.yaml',
    content: `- route:
    id: rest-to-direct
    from:
      uri: rest:get:/hello
      steps:
        - to:
            uri: direct:greet
- route:
    id: greet
    from:
      uri: direct:greet
      steps:
        - setBody:
            constant: "Hello, World!"
        - log:
            message: "\${body}"
`,
  },
  {
    name: 'File Processing',
    filename: 'file-processing.camel.yaml',
    content: `- route:
    id: file-processing
    from:
      uri: file:input
      parameters:
        noop: "true"
      steps:
        - log:
            message: "Processing file: \${header.CamelFileName}"
        - choice:
            when:
              - simple: "\${header.CamelFileName} ends with '.xml'"
                steps:
                  - to:
                      uri: file:output/xml
            otherwise:
              steps:
                - to:
                    uri: file:output/other
`,
  },
  {
    name: 'Content Based Router',
    filename: 'content-based-router.camel.yaml',
    content: `- route:
    id: content-based-router
    from:
      uri: direct:orders
      steps:
        - choice:
            when:
              - simple: "\${body} contains 'widget'"
                steps:
                  - log:
                      message: "Received widget order"
                  - to:
                      uri: direct:widget-handler
              - simple: "\${body} contains 'gadget'"
                steps:
                  - log:
                      message: "Received gadget order"
                  - to:
                      uri: direct:gadget-handler
            otherwise:
              steps:
                - log:
                    message: "Unknown order type"
                - to:
                    uri: direct:unknown-handler
`,
  },
  {
    name: 'Error Handling',
    filename: 'error-handling.camel.yaml',
    content: `- route:
    id: error-handling
    from:
      uri: timer:trigger
      parameters:
        period: "5000"
      steps:
        - doTry:
            steps:
              - setBody:
                  simple: "Processing..."
              - to:
                  uri: http:example.com/api
            doCatch:
              - exception:
                  - java.net.ConnectException
                steps:
                  - log:
                      message: "Connection failed, retrying..."
            doFinally:
              steps:
                - log:
                    message: "Processing complete"
`,
  },
];
