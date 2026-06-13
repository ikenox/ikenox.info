---
title: 'Where should validation go in Clean Architecture?'
createdAt: '2019-03-25'
updatedAt: '2025-03-16'
---

When building a web application with Clean Architecture, I often agonize over the question of which layer is responsible for validation. Let me consider that here.

## To state the conclusion first

**The very question "which layer is responsible for validation?" is mistaken; each layer should perform the validation that is its own responsibility.**

The word "validation" has far too broad a meaning, and there's a tendency to call anything that "prevents unintended things" validation. Because of this, it's easy to fall into the illusion that validation is a single responsibility, but that isn't the case. In Clean Architecture, responsibilities are divided up by layer, and likewise for validation: **for each layer, validation means rejecting input that, if accepted, would make it impossible for that layer to fulfill its own responsibility.**\
So validation exists in every layer, and the responsibility and meaning of validation differs from layer to layer.

And conversely, in a given layer, you shouldn't be so meddlesome as to perform validation beyond that layer's responsibility. Doing so often causes some kind of inconvenience (described later).

### Validation is just a specification

Don't get dragged along by the word "validation" and treat it as something special, outside the framework of Clean Architecture. Validation is just a specification; it's merely the case that we bother to call a subset of the specification "validation." If there are specs like "clients can make requests in JSON format" or "users can post arbitrary text," then as the flip side of those there's simply a need for validations like "we don't accept formats other than JSON" or "you can't post if the body is blank."\
**Validation arises as a byproduct of the system trying to fulfill the specifications and responsibilities assigned to it.**

It feels like the essential part of the story is already over, but from here on I'll consider concretely which layer should do which kind of validation in Clean Architecture.

## Validation in the Frameworks & Drivers layer

This layer is positioned at the outermost edge in Clean Architecture, and although the amount we implement ourselves is small, validation can be performed in this layer too.

For example, nginx has a setting that returns HTTP status code 413 (Entity Too Large) when the request data is too large, and this too can be called a kind of validation. Tamper-checking of requests in SSL/TLS might also be called validation. Validation in this layer mainly seems to play the role of restrictions stemming from technical details such as the OS or hardware, and ensuring a minimum level of security.

## Validation in the Interface Adapter layer

The responsibility of the Interface Adapter is converting data formats between the inside and outside of the app. For example, it deserializes the JSON string contained in the body of an HTTP request coming from outside into something like a dictionary object and passes it to the appropriate UseCase.

Here, when, say, the request body is corrupted and isn't in JSON format, the conversion between internal and external data can't be completed, so it's common to treat this as an error—and this too can be called a kind of validation error. It detects and rejects the fact that the protocol for the exchange isn't being followed, so it's a full-fledged validation error.\
Validation in the Interface Adapter layer can be said to be "checking whether the protocol for exchanges between the inside and outside of the system is being followed."

Conversely, if it could be deserialized into an object correctly, then no checks beyond that—such as checking the number of characters or numeric ranges—are needed in the Interface Adapter layer. Because doing so would deviate from its role of converting data formats between the inside and outside.

## Validation in the Application layer and the Domain layer respectively

Application logic is written in the Application layer[^1], and domain logic is written in the Domain layer[^2].

[^1]: In the original work, this is called the Application Business Rules layer

[^2]: In the original work, this is called the Enterprise Business Rules layer

By the way, regarding the question "what's the difference between application logic and domain logic?", there's the problem that it's hard to express in a way that's intuitive and not prone to varying interpretations, but for now let me proceed with the following definitions.

- **Application logic**: Logic for the system's/app's own convenience. Logic that depends on the shape of the system or app. Logic that exists because things take the shape of a system or app. Use-case-specific logic. Examples include, in a money-transfer service, persisting/retrieving data through a persistence layer (Repository), or a spec like "when money is withdrawn, send an email notification."

- **Domain logic**: Logic that expresses the domain. Logic that could exist regardless of the shape of the system or app. Logic that could exist even if the domain you want to handle didn't take the shape of a system or app. Logic that holds regardless of the use case. An example is, in a money-transfer service, a spec like "you can't transfer an amount greater than your balance."

\* Note that whether something is application logic or domain logic can change depending on "what you treat as the domain in that system in the first place." This property is, I think, one of the reasons it's hard to put the difference between the two into words.

So let me think about validation in the Application layer and the Domain layer respectively, using concrete examples. First consider the following validation.

`In an e-commerce site, because the server's processing capacity is limited, restrict the maximum number that can be ordered at once to 99.`

Held up against the earlier definitions, this can be called application logic.
The upper limit of 99 here is a spec for the system's convenience, not logic involved in expressing the domain itself. So this is application logic, and it can be said it should be written in the Application layer.

Then how about the next one?

`In an e-commerce site, when running a limited sale with a per-person purchase limit, restrict the maximum number one person can order to 3.`

This can be called domain logic. Because without this validation, the domain of a limited sale wouldn't hold. Since it's domain logic, it can be said it should be written in the Domain layer.

As you can see from the two examples above, what's tricky is that **even for a single validation of an input number, it can be application logic in some cases and domain logic in others.**\
Since the two are almost identical in wording, this fact is easy to overlook. You need to carefully discern whether a given validation should be written in the Application layer or the Domain layer.

## What happens if you write validation in the wrong place

So far I've described what kind of validation each layer should do.
Now let me consider what happens if a given layer is meddlesome and does even the validation that should be done in another layer.

### When validation that should be done in an inner layer is done in an outer layer

The downside of this pattern is relatively easy to understand, or perhaps self-evident. If you do validation that should really be done in a more inner layer in an outer layer, it's conceivable that the same kind of logic increases copy-paste-style across multiple places, and that omissions of what should be mandatory processing become more likely.

Then what about the reverse pattern?

### When validation that should be done in an outer layer is done in an inner layer

For example, in a text-posting SNS, consider the validation "due to the server's processing capacity, cap the number of characters when posting at 10,000." Here, the limit of 10,000 characters is an upper bound for the system's convenience, so it seems it can be called application logic.

What happens if you write such application logic in the more inner Domain layer?
Consider what happens if you validate the character count in the constructor of the posted-text entity.

It may not be a problem at first, but consider, for example, a later change like "server load has become tough, so raise the limit to 5,000 characters." Then, when you try to take existing posts out of the persistence layer and restore them as entities, existing posts that exceed 5,000 characters would hit the constructor's validation, cause an error, and become unrestorable.
Also, at the point you decided on this change, there was no change in the domain of the text-posting SNS. What changed was only the situation of the system (application). Nevertheless, you fall into the unnatural state of having to change logic written in the Domain layer.

This can be said to be a phenomenon that happened because logic that should originally be in the Application layer was written in the Domain layer. Had you written it in the Application layer, you could have limited the validation to run only in the use case for new posts, and you could have made the character limit stricter only for new posts without affecting existing posts at all.

In this way, if you do validation that should really be done in a more outer layer in an inner layer, situations arise where you're troubled by unnecessarily strong consistency.
Also, in general, the more inner a layer's classes are, the more they tend to be depended upon by other classes, so if you write too much validation on the inner side, the error-handling code on the depending side also increases accordingly. The more inner you go, the more important it is to keep validation to the truly necessary minimum.

## Summary

Looking at it this way, you can see that although each layer has a different responsibility, validation arises as a result of each fulfilling its own responsibility—obvious, perhaps, but interesting. Maybe all practices related to system design, if you trace them back, come down to the simple principle of "each should faithfully fulfill only its own responsibility."

Rather than consciously trying to write validation, it seems the ideal design and implementation policy is one where validation logic gets written naturally as a result of giving each layer its appropriate responsibility.
