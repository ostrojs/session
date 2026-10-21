import proxyaddr from 'proxy-addr';

interface IUtil {
    defineMember(obj: Record<string, any>, name: string): void;
    compileTrust(val: any): Function;
}

const util: IUtil = {
    /**
     * Recursively define nested member objects.
     *
     * @param obj - Target object.
     * @param name - Dot-notated member path.
     */
    defineMember(obj: Record<string, any>, name: string): void {
        const nameSplit: string[] = name.split('.');
        let exists: any = obj;

        for (let i = 0; i < nameSplit.length - 1; i++) {
            if (!Object.prototype.hasOwnProperty.call(exists, nameSplit[i]) || typeof exists[nameSplit[i]] !== 'object') {
                exists[nameSplit[i]] = {};
            }
            exists = exists[nameSplit[i]];
        }
    },

    /**
     * Compile trust configuration into a trust checking function.
     *
     * @param val - Trust configuration value.
     * @returns Trust evaluation function.
     */
    compileTrust(val: any): Function {
        if (typeof val === 'function') return val;

        if (val === true) {
            return function (): boolean { return true; };
        }

        if (typeof val === 'number') {
            return function (a: any, i: number): boolean { return i < val; };
        }

        if (typeof val === 'string') {
            val = val.split(/ *, */);
        }

        return proxyaddr.compile(val || []);
    }
};

export default util;