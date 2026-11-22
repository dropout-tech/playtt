export interface BackingInventory {
  complete: boolean;
  visitedNodes: number;
  ordinaryViewBytes: number;
  ordinaryUsedBytes: number;
  invalidUsedBytes: number;
  ordinaryArrayElements: number;
  uniqueExternalBuffers: number;
  uniqueExternalBackingBytes: number;
  sharedExternalBuffers: number;
  crossCategoryBuffers: number;
  heapAliasedViews: number;
  maxExternalBufferBytes: number;
  byCategory: Record<string, {buffers: number; backingBytes: number}>;
  largestExternalBuffers: Array<{bytes: number; views: number; categories: string[]}>;
}
export function collectBackingInventory(root: any, heapBuffer: ArrayBufferLike | undefined, compressedPeek: (node: any) => {logicalBytes: number; compressedBytes: number} | undefined): {
  fileBytes: number; files: number; heapAliasedFileBytes: number; unknownFileBuffers: number;
  compressedCoreFiles: number; compressedCoreBytes: number; compressedCoreLogicalBytes: number;
  categories: Record<string, number>; backingInventory: BackingInventory;
};
