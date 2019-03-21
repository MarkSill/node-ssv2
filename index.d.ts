export interface SSv2SerializationOptions {
    minify?: boolean;
}
export declare function serialize(obj: any, options?: SSv2SerializationOptions): string;
export declare function deserialize(str: string): any;
