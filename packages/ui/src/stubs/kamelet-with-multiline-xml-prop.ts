export const kameletWithMultilineXmlPropYaml = `
apiVersion: camel.apache.org/v1
kind: Kamelet
metadata:
  annotations:
    camel.apache.org/catalog.version: main-SNAPSHOT
    camel.apache.org/kamelet.group: Users
    camel.apache.org/kamelet.icon: data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgNjAgNjAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDYwIDYwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik00OC4wMTQsNDIuODg5bC05LjU1My00Ljc3NkMzNy41NiwzNy42NjIsMzcsMzYuNzU2LDM3LDM1Ljc0OHYtMy4zODFjMC4yMjktMC4yOCwwLjQ3LTAuNTk5LDAuNzE5LTAuOTUxCgljMS4yMzktMS43NSwyLjIzMi0zLjY5OCwyLjk1NC01Ljc5OUM0Mi4wODQsMjQuOTcsNDMsMjMuNTc1LDQzLDIydi00YzAtMC45NjMtMC4zNi0xLjg5Ni0xLTIuNjI1di01LjMxOQoJYzAuMDU2LTAuNTUsMC4yNzYtMy44MjQtMi4wOTItNi41MjVDMzcuODU0LDEuMTg4LDM0LjUyMSwwLDMwLDBzLTcuODU0LDEuMTg4LTkuOTA4LDMuNTNDMTcuNzI0LDYuMjMxLDE3Ljk0NCw5LjUwNiwxOCwxMC4wNTYKCXY1LjMxOWMtMC42NCwwLjcyOS0xLDEuNjYyLTEsMi42MjV2NGMwLDEuMjE3LDAuNTUzLDIuMzUyLDEuNDk3LDMuMTA5YzAuOTE2LDMuNjI3LDIuODMzLDYuMzYsMy41MDMsNy4yMzd2My4zMDkKCWMwLDAuOTY4LTAuNTI4LDEuODU2LTEuMzc3LDIuMzJsLTguOTIxLDQuODY2QzguODAxLDQ0LjQyNCw3LDQ3LjQ1OCw3LDUwLjc2MlY1NGMwLDQuNzQ2LDE1LjA0NSw2LDIzLDZzMjMtMS4yNTQsMjMtNnYtMy4wNDMKCUM1Myw0Ny41MTksNTEuMDg5LDQ0LjQyNyw0OC4wMTQsNDIuODg5eiIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K
    camel.apache.org/kamelet.support.level: Stable
    camel.apache.org/provider: Apache Software Foundation
  labels:
    camel.apache.org/kamelet.type: source
  name: kamelet-6703
spec:
  definition:
    description: <strong>sample</strong>
    properties:
      period:
        default: 5000
        title: Period
        type: integer
    title: kamelet-6703
    type: object
  dependencies:
    - camel:timer
    - camel:http
    - camel:kamelet
  template:
    from:
      steps:
        - to:
            description: <strong>sample</strong>
            parameters:
              httpUri: random-data-api.com/api/v2/users
            uri: https
        - setBody:
            id: setBody-1975
            simple:
              expression: |-
                foo
                <Some>aaa</Some>
                bbb
        - to: kamelet:sink
      id: from-2961
      parameters:
        period: "{{period}}"
        timerName: user
      uri: timer
  types:
    out:
      mediaType: application/json
`;
