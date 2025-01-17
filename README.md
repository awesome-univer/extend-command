# Extend Command

## Features

- [x]  Extended paste function, supports `cell.custom` paste
- [x]  Extend the autofill function to support `cell.custom` filling

## How to test?

1. Operation fill or copy and paste
3. Check snapshot
```js
univerAPI.getActiveWorkbook().save();
```

## Reference

[Extend an Existing Command](https://docs.univer.ai/en-US/guides/sheets/advanced/custom-command#extend-an-existing-command)
