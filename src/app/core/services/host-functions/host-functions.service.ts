import { Injectable } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree/nz-tree-base-node';
import { xdr, buildInvocationTree, InvocationTree, ExecuteInvocation, CreateInvocation } from 'stellar-sdk';

@Injectable({
  providedIn: 'root'
})
export class HostFunctionsService {

  constructor() { }

  getNodeChildren(invocations: InvocationTree['invocations']): NzTreeNodeOptions[] {
    return invocations.map((invocation: InvocationTree): NzTreeNodeOptions => {
      if (invocation.type === 'execute') {
        return {
          key: crypto.randomUUID(),
          title: 'Execution parameters',
          expanded: true,
          children: [{
            key: crypto.randomUUID(),
            title: 'Contract',
            expanded: true,
            children: [{
              isLeaf: true,
              key: crypto.randomUUID(),
              title: (invocation.args as ExecuteInvocation).source,
              expanded: true,
            }]
          }, {
            key: crypto.randomUUID(),
            title: 'Function',
            expanded: true,
            children: [{
              isLeaf: true,
              key: crypto.randomUUID(),
              title: Buffer.from((invocation.args as ExecuteInvocation).function).toString('utf-8'),
              expanded: true,
            }],
          }, {
            key: crypto.randomUUID(),
            title: 'Arguments',
            expanded: true,
            children: (invocation.args as ExecuteInvocation).args.map(arg => ({
              isLeaf: true,
              key: crypto.randomUUID(),
              title: typeof arg !== 'object' ? arg : JSON.stringify(arg, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2),
              expanded: true,
            })),
          }, {
            key: crypto.randomUUID(),
            title: 'Sub Invocations',
            expanded: true,
            children: this.getNodeChildren(invocation.invocations)
          }],
        };
      } else {
        return {
          isLeaf: true,
          key: crypto.randomUUID(),
          title: `Create ${(invocation.args as CreateInvocation).type}`,
        };
      }
    });
  }

  parseHostFunctionIntoNodeTree(f: xdr.SorobanAuthorizedInvocation, preKey: number): NzTreeNodeOptions[] {
    const invocationTree: InvocationTree = buildInvocationTree(f);
    console.log(invocationTree);
    return this.getNodeChildren([invocationTree]);
  }

}
