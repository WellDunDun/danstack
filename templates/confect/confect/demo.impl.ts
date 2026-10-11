import { FunctionImpl, GroupImpl } from '@confect/server';
import { Layer } from 'effect';
import schema from './_generated/schema';
import spec from './demo.spec';
import { greeting } from '../src/domain';
export default GroupImpl.make(schema, spec).pipe(
  Layer.provide(FunctionImpl.make(schema, spec, 'hello', ({ name }) => greeting(name))),
  GroupImpl.finalize,
);
