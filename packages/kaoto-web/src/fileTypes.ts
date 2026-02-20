export interface FileType {
  /** Display label */
  label: string;
  /** The suffix appended after the user-provided name (e.g. ".camel.yaml") */
  suffix: string;
  /** Empty-file template content */
  template: string;
}

export const FILE_TYPES: FileType[] = [
  {
    label: 'Camel Route',
    suffix: '.camel.yaml',
    template: `- route:
    id: new-route
    from:
      uri: timer:tick
      parameters:
        period: "1000"
      steps:
        - log:
            message: "\${body}"
`,
  },
  {
    label: 'Kamelet',
    suffix: '.kamelet.yaml',
    template: `apiVersion: camel.apache.org/v1
kind: Kamelet
metadata:
  name: new-kamelet
spec:
  definition:
    title: New Kamelet
    description: A custom Kamelet
  template:
    from:
      uri: timer:tick
      parameters:
        period: "1000"
      steps:
        - log:
            message: "\${body}"
`,
  },
  {
    label: 'Pipe',
    suffix: '.pipe.yaml',
    template: `apiVersion: camel.apache.org/v1
kind: Pipe
metadata:
  name: new-pipe
spec:
  source:
    ref:
      kind: Kamelet
      apiVersion: camel.apache.org/v1
      name: timer-source
    properties:
      period: 1000
  sink:
    ref:
      kind: Kamelet
      apiVersion: camel.apache.org/v1
      name: log-sink
`,
  },
  {
    label: 'Integration',
    suffix: '.integration.yaml',
    template: `apiVersion: camel.apache.org/v1
kind: Integration
metadata:
  name: new-integration
spec:
  flows:
    - route:
        id: new-route
        from:
          uri: timer:tick
          parameters:
            period: "1000"
          steps:
            - log:
                message: "\${body}"
`,
  },
];
