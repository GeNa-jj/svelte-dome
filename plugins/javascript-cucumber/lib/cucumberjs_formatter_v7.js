const common = require('./cucumberjs_formatter_common.js')

const formatter = function (options) {
  const cucumber = require(options.parsedArgvOptions.cucumberLibPath)

  new cucumber.SummaryFormatter(options)

  let currentUri = ''
  let currentFeatureName = ''

  const eventDataCollector = options.eventDataCollector

  options.eventBroadcaster.on('envelope', function (envelope) {
    if (envelope.testCase) {
      logTestCase(envelope.testCase)
    }
    else if (envelope.testRunStarted) {
      logTestRunStarted()
    }
    else if (envelope.testRunFinished) {
      logTestRunFinished()
    }
    else if (envelope.testCaseStarted) {
      logTestCaseStarted(envelope.testCaseStarted)
    }
    else if (envelope.testCaseFinished) {
      logTestCaseFinished(envelope.testCaseFinished)
    }
    else if (envelope.testStepStarted) {
      logStepStarted(envelope.testStepStarted)
    }
    else if (envelope.testStepFinished) {
      logStepFinished(envelope.testStepFinished)
    }
  })

  this.finished = function () {
    return options.cleanup ? options.cleanup() : Promise.resolve()
  }

  function logTestCase({pickleId}) {
    const prevUri = currentUri
    const prevFeatureName = currentFeatureName

    const pickle = eventDataCollector.getPickle(pickleId)
    if (!pickle) return

    const uri = pickle.uri
    if (prevUri === uri) return

    currentUri = uri

    const document = eventDataCollector.getGherkinDocument(uri)
    if (document && document.feature) {
      currentFeatureName = document.feature.name
    }

    if (prevUri && prevFeatureName) {
      logFeatureFinished(prevFeatureName)
    }
    logFeatureStarted()
  }

  function logTestRunStarted() {
    console.log(`##teamcity[enteredTheMatrix timestamp='${common.getCurrentDate()}']\n`)
    console.log(`##teamcity[customProgressStatus testsCategory = 'Scenarios' count = '0' timestamp='${common.getCurrentDate()}']`)
  }

  function logTestRunFinished() {
    logFeatureFinished(currentFeatureName)
  }

  function logFeatureStarted() {
    console.log(
      `##teamcity[testSuiteStarted name='Feature: ${common.escape(currentFeatureName)}' timestamp='${common.getCurrentDate()}' locationHint='file:///${currentUri}']`)
  }

  function logFeatureFinished(prevFeatureName) {
    console.log(`##teamcity[testSuiteFinished name='Feature: ${common.escape(prevFeatureName)}' timestamp='${common.getCurrentDate()}']`)
    console.log(`##teamcity[customProgressStatus testsCategory = '' count = '0' timestamp = '${common.getCurrentDate()}']`)
  }

  function logTestCaseStarted({id}) {
    const data = getTestData(id)
    console.log(`##teamcity[customProgressStatus type = 'testStarted' timestamp='${common.getCurrentDate()}']`)
    console.log(`##teamcity[testSuiteStarted name='Scenario: ${common.escape(
      data.pickle.name)}' timestamp='${common.getCurrentDate()}' locationHint='file:///${currentUri + ':' + findTestCaseLine(data)}']`)
  }

  function logTestCaseFinished({testCaseStartedId}) {
    const data = getTestData(testCaseStartedId)
    const status = data.worstTestStepResult.status
    switch (status) {
      case cucumber.Status.PASSED:
        console.log(`##teamcity[customProgressStatus type = 'testFinished' timestamp='${common.getCurrentDate()}']`)
        break
      case cucumber.Status.AMBIGUOUS:
      case cucumber.Status.FAILED:
        console.log(`##teamcity[customProgressStatus type = 'testFailed' timestamp='${common.getCurrentDate()}']`)
        break
      case cucumber.Status.SKIPPED:
        console.log(`##teamcity[customProgressStatus type = 'testSkipped' timestamp='${common.getCurrentDate()}']`)
        break
    }
    console.log(`##teamcity[testSuiteFinished name='Scenario: ${common.escape(data.pickle.name)}' timestamp='${common.getCurrentDate()}']`)
  }

  function logStepStarted({testCaseStartedId, testStepId}) {
    const data = getTestData(testCaseStartedId)
    const step = findStepById(data, testStepId)
    if (!step) return

    const stepName = step.text
    const stepLine = findStepLine(data, step)
    console.log(
      `##teamcity[testStarted name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' captureStandardOutput = 'true' locationHint='file:///${
        currentUri + ':' + stepLine}']`)
  }

  function logStepFinished({testCaseStartedId, testStepId, testStepResult = {}}) {
    const data = getTestData(testCaseStartedId)
    let step = findStepById(data, testStepId)
    if (step == null) return

    const stepName = step.text
    const duration = durationToMs(testStepResult.duration)

    switch (testStepResult.status) {
      case cucumber.Status.UNDEFINED:
        console.log(`##teamcity[testFailed name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' message='' ]`)
        break
      case cucumber.Status.AMBIGUOUS:
      case cucumber.Status.FAILED:
        console.log(`##teamcity[testFailed name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' details='${common.escape(
          testStepResult.message)}' message='' ]`)
        break
      case cucumber.Status.SKIPPED:
        console.log(`##teamcity[testIgnored name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}']`)
        break
    }
    console.log(`##teamcity[testFinished name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' duration='${duration}']`)
  }

  function getTestData(testCaseId) {
    return eventDataCollector.getTestCaseAttempt(testCaseId)
  }

  function findTestCaseLine(testCaseAttempt) {
    const scenario = findScenario(testCaseAttempt)

    const exampleLineNodeId = testCaseAttempt.pickle.astNodeIds[1]
    if (exampleLineNodeId && scenario && scenario.examples) {
      const example = findTestCaseExample(scenario, exampleLineNodeId)
      if (example) return example.location.line
    }

    return scenario ? scenario.location.line : -1
  }

  function findStepLine(testCaseAttempt, step) {
    const scenario = findScenario(testCaseAttempt)
    if (!scenario || !step) return -1

    let exampleNodeId = step.astNodeIds[1]
    if (exampleNodeId) {
      const example = findTestCaseExample(scenario, exampleNodeId)
      if (example) return example.location.line
    }

    const stepNodeId = step.astNodeIds[0]
    if (!stepNodeId) return -1

    const stepDocument = scenario.steps.find(function (s) {
      return s.id === stepNodeId
    })

    return stepDocument && stepDocument.location ? stepDocument.location.line : -1
  }

  function findTestCaseExample(scenario, lineNodeId) {
    const tableLines = scenario.examples.reduce(function (acc, e) {
      return e.tableBody ? acc.concat(e.tableBody) : acc
    }, [])

    return tableLines.find(function (line) {
      return line.id === lineNodeId
    })
  }

  function findScenario(testCaseAttempt) {
    const nodeId = testCaseAttempt.pickle.astNodeIds[0]
    if (!nodeId) return null

    const children = testCaseAttempt.gherkinDocument.feature.children.reduce((acc, child) => {
      if (child.scenario) {
        acc.push(child)
      } else if (child.rule) {
        acc.push(...child.rule.children)
      }
      return acc
    }, [])

    const child = children.find(function (c) {
      return c.scenario && c.scenario.id === nodeId
    })

    return child ? child.scenario : null
  }

  function findStepById(testCaseAttempt, testStepId) {
    const testStep = testCaseAttempt.testCase.testSteps.find(function (s) {
      return s.id === testStepId
    })
    if (!testStep) return null

    return testCaseAttempt.pickle.steps.find(function (s) {
      return s.id === testStep.pickleStepId
    })
  }

  function last(a) {
    return a[a.length - 1]
  }

  function durationToMs(duration) {
    if (!duration) return -1
    return Math.round(duration.seconds * 1000 + duration.nanos / 1000000)
  }
}

module.exports = formatter
