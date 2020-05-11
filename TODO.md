# To-Do List

List of things (in no particular order) that _might_ be added in the future.

---

## Short-form Rules

Remove need for declarations containing only a `type` rule.

```JavaScript
{
  a: 'string' // Expands to { type: 'string' }.
}
```

---

## Multi-type Rules

Allow multiple rules targeting different types for the same property.

```JavaScript
{
  a: {
    type: {
      // Applies if `a` of input object is a string.
      'string': {
        minLength: 2
      },
      // Applies if `a` of input object is a number.
      'number': {
        min: 2
      }
    },
    required: true // Applies to both types.
  }
}
```

### Potential Issues

- Downwards propagation of `required` rule. Apply if any overload has `required` status? Derive multiple schemas (potentially _very_ inefficient)?

---

## Rule Dependencies

Make rule application dependant on application of other rule(s).

```JavaScript
{
  a: { type: 'string' },

  // Rule that is only applied if `a` does.
  b: {
    type: 'number',
    dependsOn: 'a' // Array for multi-dependancies.
  }
}
```

### Potential Issues

- Circular dependencies.
