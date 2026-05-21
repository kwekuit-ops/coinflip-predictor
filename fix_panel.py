path = 'src/components/PredictorPanel.jsx'
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

dclose = '          </' + 'div' + '>\n'
dclose2 = '        </' + 'motion.div' + '>\n'
dclose2 = '        </' + 'div' + '>\n'

lines[141] = dclose
lines[142] = dclose2
lines[145] = '      <' + 'div' + '>\n'
lines[169] = '          </' + 'div' + '>\n'
lines[171] = '      </' + 'div' + '>\n'
lines[172] = '    </' + 'motion.div' + '>\n'
lines[172] = '    </' + 'div' + '>\n'

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('fixed')
