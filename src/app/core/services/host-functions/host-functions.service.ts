import { Injectable } from '@angular/core';
import * as SorobanClient from 'soroban-client';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree/nz-tree-base-node';

@Injectable({
  providedIn: 'root'
})
export class HostFunctionsService {

  constructor() { }

  parseUInt64(data: SorobanClient.xdr.Uint64 | SorobanClient.xdr.Int64): NzTreeNodeOptions[] {
    return [{
      key: Math.random().toString(16),
      title: (data instanceof SorobanClient.xdr.Uint64) ? 'Uint64' : 'Int64',
      children: [{
        key: Math.random().toString(16),
        title: 'Low',
        children: [{
          key: Math.random().toString(16),
          title: data.low.toString(),
          isLeaf: true,
        }]
      }, {
        key: Math.random().toString(16),
        title: 'High',
        children: [{
          key: Math.random().toString(16),
          title: data.high.toString(),
          isLeaf: true,
        }]
      }, {
        key: Math.random().toString(16),
        title: 'Unsigned',
        children: [{
          key: Math.random().toString(16),
          title: `${data.unsigned}`,
          isLeaf: true,
        }]
      }],
    }];
  }

  parseInt128(data: SorobanClient.xdr.Int128Parts): NzTreeNodeOptions[] {
    return [{
      key: Math.random().toString(16),
      title: 'Int128',
      children: [{
        key: Math.random().toString(16),
        title: 'Low',
        children: this.parseUInt64(data.lo())
      }, {
        key: Math.random().toString(16),
        title: 'High',
        children: this.parseUInt64(data.hi())
      }]
    }];
  }

  parseScObject(data: SorobanClient.xdr.ScVal[]
    | SorobanClient.xdr.ScMapEntry[]
    | SorobanClient.xdr.Uint64
    | SorobanClient.xdr.Int64
    | SorobanClient.xdr.Int128Parts
    | SorobanClient.xdr.ScContractCode
    | SorobanClient.xdr.ScAddress
    | Buffer): NzTreeNodeOptions[] {
    if (data instanceof Array) {
      return data.map(d => {
        if (d instanceof SorobanClient.xdr.ScVal) {
          return {
            key: Math.random().toString(16),
            title: d.switch().name,
            chidren: this.parseScVal(d.value())
          };
        } else if (d instanceof SorobanClient.xdr.ScMapEntry) {
          return {
            key: Math.random().toString(16),
            title: 'ScMapEntry',
            chidren: [{
              key: Math.random().toString(16),
              title: 'Key',
              chidren: [{
                key: Math.random().toString(16),
                title: d.key().switch().name,
                children: this.parseScVal(d.key().value())
              }]
            }, {
              key: Math.random().toString(16),
              title: 'Value',
              chidren: [{
                key: Math.random().toString(16),
                title: d.val().switch().name,
                children: this.parseScVal(d.val().value())
              }]
            }]
          };
        } else {
          return {
            key: Math.random().toString(16),
            title: 'Can\'t be parsed by this wallet',
          };
        }
      });
    } else if (data instanceof SorobanClient.xdr.Uint64 || data instanceof SorobanClient.xdr.Int64) {
      return this.parseUInt64(data);
    } else if (data instanceof SorobanClient.xdr.Int128Parts) {
      return this.parseInt128(data);
    } else if (data instanceof SorobanClient.xdr.ScContractCode) {
      return [{
        key: Math.random().toString(16),
        title: data.switch().name,
        children: [{
          key: Math.random().toString(16),
          title: data.toXDR('base64'),
          isLeaf: true,
        }]
      }];
    } else if (data instanceof SorobanClient.xdr.ScAddress) {
      return [{
        key: Math.random().toString(16),
        title: data.switch().name,
        children: [{
          isLeaf: true,
          key: Math.random().toString(16),
          title: (data.value() instanceof SorobanClient.xdr.PublicKey)
            ? (data.value() as SorobanClient.xdr.PublicKey).toXDR('base64')
            : data.value().toString('hex')
        }]
      }];
    } else {
      return [{
        key: Math.random().toString(16),
        title: JSON.stringify(data),
      }];
    }
  }

  parseScVal(data: SorobanClient.xdr.Int64
    | number
    | SorobanClient.xdr.ScStatic
    | SorobanClient.xdr.ScObject
    | string
    | Buffer
    | SorobanClient.xdr.Uint64
    | SorobanClient.xdr.ScStatus
    | null): NzTreeNodeOptions[] {
    if (data instanceof Number) {
      return [{
        isLeaf: true,
        key: Math.random().toString(16),
        title: `${data}`,
      }];
    } else if (data instanceof SorobanClient.xdr.ScStatic) {
      return [{
        isLeaf: true,
        key: Math.random().toString(16),
        title: `${data.name}: ${data.value}`,
      }];
    } else if (data instanceof SorobanClient.xdr.ScObject) {
      return this.parseScObject(data.value());
    } else if (data instanceof String) {
      return [{
        isLeaf: true,
        key: Math.random().toString(16),
        title: `${data}`
      }];
    } else if (data instanceof Buffer) {
      return [{
        isLeaf: true,
        key: Math.random().toString(16),
        title: data.toString(),
      }];
    } else if (data instanceof SorobanClient.xdr.Uint64) {
      return this.parseUInt64(data);
    } else if (data instanceof SorobanClient.xdr.ScStatus) {
      return [{
        key: Math.random().toString(16),
        title: 'ScStatus',
        children: [{
          isLeaf: true,
          key: Math.random().toString(16),
          title: JSON.stringify(data), // TODO:
        }]
      }];
    } else {
      return [{
        isLeaf: true,
        key: Math.random().toString(16),
        title: JSON.stringify(data),
      }];
    }
  }

  getNodeChildren(data: SorobanClient.xdr.HostFunction, preKey: number, i: number): NzTreeNodeOptions[] {
    const name = data.switch().name;
    const tempValue = data.value();
    let children: NzTreeNodeOptions['children'];

    if (tempValue instanceof Array) {
      const temp = tempValue as SorobanClient.xdr.ScVal[];
      children = temp.map((t, ii) => ({
        key: Math.random().toString(16),
        title: t.switch().name,
        children: this.parseScVal(t.value()),
      }));
    } else if (tempValue instanceof SorobanClient.xdr.CreateContractArgs) {
      children = [{
        key: Math.random().toString(16),
        title: 'Contract ID',
        children: [{
          isLeaf: true,
          key: Math.random().toString(16),
          title: JSON.stringify(tempValue),
        }]
      }];
    } else if (tempValue instanceof SorobanClient.xdr.InstallContractCodeArgs) {
      children = [{
        key: Math.random().toString(16),
        title: 'Code',
        children: [{
          isLeaf: true,
          key: Math.random().toString(16),
          title: JSON.stringify(tempValue),
        }]
      }];
    }

    return [{
      key: Math.random().toString(16),
      expanded: false,
      title: name,
      children
    }];
  }

  parseHostFunctionIntoNodeTree(f: SorobanClient.xdr.HostFunction, preKey: number): NzTreeNodeOptions[] {
    return [{
      expanded: true,
      key: Math.random().toString(16),
      title: 'Functions Params',
      children: this.getNodeChildren(f, preKey, 0),
    }];
  }

  // parseHostFootprintIntoNodeTree() {}
}

export interface TreeNode {
  name: string;
  value: any;
}
