const formatter = function (options) {
  const path = require('path');
  const cucumber = require(options.cucumberLibPath)
  const common = require('./cucumberjs_formatter_common.js')
  //Need to create an instance to see the summary in the console output
  const formatter = new cucumber.Formatter(options)
  const summaryFormatter = new cucumber.SummaryFormatter(options)
  let currentFeature = ''
  let featureIndex = 0
  /**
   * test-run == Feature == testSuite
   * test-case == Scenario == testSuite
   * test-step == Step == test
   */
  options.eventBroadcaster.on('test-run-started', logFeatureStarted)
  options.eventBroadcaster.on('test-run-finished', logFeatureFinished)
  options.eventBroadcaster.on('test-case-started', logTestCaseStarted)
  options.eventBroadcaster.on('test-case-finished', logTestCaseFinished)
  options.eventBroadcaster.on('test-step-started', logStepStarted)
  options.eventBroadcaster.on('test-step-finished', logStepFinished)

  function logFeatureStarted() {
    //For cases when feature file exists but contains no content
    if (getFeatureName() == null) return
    if (currentFeature === '') {
      currentFeature = getFeatureName()
      console.log(`##teamcity[enteredTheMatrix timestamp='${common.getCurrentDate()}']\n`)
      console.log(`##teamcity[customProgressStatus testsCategory = 'Scenarios' count = '0' timestamp='${common.getCurrentDate()}']`)
    }
    console.log(
      `##teamcity[testSuiteStarted name='Feature: ${common.escape(currentFeature)}' timestamp='${common.getCurrentDate()}' locationHint='file:///${getUri()}']`)
  }

  function logFeatureFinished() {
    console.log(`##teamcity[testSuiteFinished name='Feature: ${common.escape(currentFeature)}' timestamp='${common.getCurrentDate()}']`)
    console.log(`##teamcity[customProgressStatus testsCategory = '' count = '0' timestamp = '${common.getCurrentDate()}']`)
    featureIndex++
  }

  function logTestCaseStarted({sourceLocation, attemptNumber}) {
    const data = getTestData({sourceLocation, attemptNumber})
    const featureName = data.gherkinDocument.feature.name
    if (featureName !== currentFeature) {
      logFeatureFinished()
      currentFeature = featureName
      logFeatureStarted()
    }
    console.log(`##teamcity[customProgressStatus type = 'testStarted' timestamp='${common.getCurrentDate()}']`)
    console.log(`##teamcity[testSuiteStarted name='Scenario: ${common.escape(
      data.pickle.name)}' timestamp='${common.getCurrentDate()}' locationHint='file:///${getUri() + ':' + sourceLocation.line}']`)
  }

  function logTestCaseFinished(event) {
    const data = getTestData(event)
    const status = data.result.status
    switch (status) {
      case 'passed':
        console.log(`##teamcity[customProgressStatus type = 'testFinished' timestamp='${common.getCurrentDate()}']`)
        break
      case 'ambiguous':
      case 'failed':
        console.log(`##teamcity[customProgressStatus type = 'testFailed' timestamp='${common.getCurrentDate()}']`)
        break
      case 'skipped':
        console.log(`##teamcity[customProgressStatus type = 'testSkipped' timestamp='${common.getCurrentDate()}']`)
        break
    }
    console.log(`##teamcity[testSuiteFinished name='Scenario: ${common.escape(data.pickle.name)}' timestamp='${common.getCurrentDate()}']`)
  }

  function logStepStarted(event) {
    const data = getTestData(event.testCase)
    let step = data.pickle.steps[event.index]
    if (step == null) return

    const stepName = step.text
    const stepLine = step.locations[0].line
    console.log(
      `##teamcity[testStarted name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' captureStandardOutput = 'true' locationHint='file:///${
        getUri() + ':' + stepLine}']`)
  }

  function logStepFinished(event) {
    const data = getTestData(event.testCase)
    let step = data.pickle.steps[event.index]
    if (step == null) return

    const stepName = step.text
    const status = event.result.status
    const duration = getDuration(event)

    switch (status) {
      case 'undefined':
        console.log(`##teamcity[testFailed name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' message='' ]`)
        break
      case 'ambiguous':
      case 'failed':
        console.log(`##teamcity[testFailed name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' details='${common.escape(
          event.result.exception.stack)}' message='' ]`)
        break
      case 'skipped':
        console.log(`##teamcity[testIgnored name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}']`)
        break
    }
    console.log(`##teamcity[testFinished name = 'Step: ${common.escape(stepName)}' timestamp='${common.getCurrentDate()}' duration='${duration}']`)
  }

  function getTestData({sourceLocation, attemptNumber}) {
    if (typeof formatter.eventDataCollector.getTestCaseData === 'function') {
      const data = formatter.eventDataCollector.getTestCaseData(sourceLocation)
      return Object.assign({}, data, {result: data.testCase.result}) // compatibility of previous versions with v6
    }

    return formatter.eventDataCollector.getTestCaseAttempt({sourceLocation, attemptNumber})
  }

  function getDuration({testCase, result}) {
    if (!result) return -1
    const duration = result.duration || 0

    if (testCase.attemptNumber != null) {
      // version = 6
      return duration / 1000000
    }
    // 3 <= version < 6
    return duration
  }

  function getFeatureName() {
    let documentMap = formatter.eventDataCollector.gherkinDocumentMap
    const length = Object.keys(documentMap).length
    const uri = Object.keys(documentMap)[featureIndex]
    if (!documentMap[uri] || !documentMap[uri].feature) return null
    return documentMap[uri].feature.name
  }

  function getUri() {
    return formatter.cwd + path.sep + getFeatureFile()
  }

  function getFeatureFile() {
    return common.escape(Object.keys(formatter.eventDataCollector.gherkinDocumentMap)[featureIndex])
  }
}

module.exports = formatter
