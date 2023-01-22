let regexStart = /^[a-zA-Z]/
let regexEnd = /[a-zA-Z]$/
console.log(regexStart.test('a1aag') && regexEnd.test('aag'))