# node-red-contrib-match
A Node Red node for matching messages by properties within a flow.

This node will check all of the specified properties in a message or in the global or flow contexts
and switch the message flow between two outputs depending on whether all rules are met or not.

The match node is configured with a list of rules.  Each rule tests one specific property using either the usual comparison operators, ranges, regex, null, not null, boolean values, or type.  Comparisons can be made against static values, other properties, and the property's previous value.  The specification of the property to be checked is quite powerful, allowing the probing inside objects and arrays.

If all tests pass, the message is sent on the first output.  If any test fails, the message is sent on the second output.
