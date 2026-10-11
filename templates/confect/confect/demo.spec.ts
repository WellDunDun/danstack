import { FunctionSpec, GroupSpec } from '@confect/core';
import { Schema } from 'effect';
export default GroupSpec.make().addFunction(FunctionSpec.publicQuery({
  name: 'hello',
  args: () => ({ name: Schema.String }),
  returns: () => Schema.String,
}));
