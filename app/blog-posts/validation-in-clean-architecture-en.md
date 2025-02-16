---
title: 'The Clean Architecture: Where should we put validation logics in the code'
date: '2019-09-21'
lang: en
---

When working with Clean Architecture, I sometimes wonder where should I put validation logics in the
code.
In this archicle, I'll try to conclude where should we put validation logics in the Clean
Architecture.

## Conclusion

I think, **the question "where is the correct place of the validation logic" is wrong.**
**We should put the validation logic to each layer of Clean Architecture.**

The meaning of the word "validation" is very vast and ambiguous because it has different meanings
depending on its context.
Nevertheless, we tend to misunderstand that the "validation" is just single role. But actually it's
not. **Just as Clean Architecture splits the responsibility by layers, each layer has its own
validation logic.**
**In each layer, the system should reject the input which breaks its layer's responsibility. This is
validation.** So the meaning of validation is differrent depending on its context.

In Clean Architecture, a certain layer should NOT have validation logic which is not responsible for
its layer.
Otherwise, the problems I'll write later will occur.

## Validation is just specification

**We should NOT think that specification and validation are different things. Validation is just
specification. The validation is just a subset of the specification.**

For example, the specification `the client can request with JSON data` means the existence of the
validation `the not JSON data will be rejected`. Thus specification and validation is essencially
same. The validation is naturally derived from the specification.

That's all of the concept of this article.
Next I will discuss about concrete validation in each layer of Clean Architecture.

## Validation in Frameworks & Drivers layer

This layer is most outer layer in Clean Architecture.
Actually we don't write much code by ourself in this layer, but validation does certainly exists.

For example, nginx will return `413 Entity Too Large` if the request is too large. This is a kind of
validation.
The other is verification of request reliability by SSL/TLS.
In this layer, validation means protecting the system at low level.

## Validation in Interface Adapter layer

The responsibility of this layer is converting data from one's format to another one's.
For example, converting request body JSON into Java (or Ruby or ...) object.

For example. if JSON is malformed, system can't continue to convert data so we will throw error.
It's validation.
In this layer, validation specifies data serialization/deserialization protocol.

**But in this layer, we should NOT validate character length or numeric ranges or non-null
constraints, etc.**
**It is not the responsibility of this layer. The responsibility of this layer is converting data
format.**

## Validation in Application layer

In this layer, as validation, we must ensure that domain objects can receive the input.
We should reject the input which the domain object can't be received.

For example, when some mandatory parameters are missing, it should be rejected because the domain
object has no way to receive like that parameter.

## Validation in Domain(Entity) layer

In this layer, validation is equivalent to domain rule.
For example, in banking system, the
rule `It's impossible to withdraw much money than remained balance` is exactly validation.

## What is happen if we put a validation logic to wrong layer

Above I discussed about the validation in each layer.
By the way, if we mistake the placement of validation logic, what is happened?

#### When putting a validation logic more outer than correct layer

In such case, we will not be ale to keep DRY principle.
Code duplication and copy & paste will occur. And unexpected code which doesn't satisfy
specification will be easily increased.

#### When putting a validation logic more inner than correct layer

In such case, we will struggle with restriction which is unneccesarry strong.
A restriction from validation logic will be broadly applicated even though you don't need it.

## Summary

Validation logic is naturally derived in each layer's responsibility.
I think most practices of software design are origin from just a simple prinple, commonly known
as [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle).

Not validate, but just give proper specification and responsibility to each layer.
