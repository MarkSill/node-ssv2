

export interface SSv2SerializationOptions {
	minify?: boolean;
}

function isObject(obj: any) {
	return obj === Object(obj);
}

function printObject(obj: any, keys: (number | string)[], indentation: number, objects: Object[], options: SSv2SerializationOptions) {
	let outStr = "";
	let numeric = 0;
	for (let key of keys) {
		let k: number | string | undefined = key;
		let v = obj[k];
		let table = false;
		if (typeof v === "function") {
			continue;
		} else if (isObject(v)) {
			if (objects.indexOf(v) !== -1) {
				throw new Error("recursion in serialization");
			}
			objects.push(v);
			let str = iSerialize(v, indentation + 1, objects, options);
			if (str.length === 0) {
				continue;
			} else {
				v = `\n${str}`;
				if (v.endsWith("\n")) {
					v = v.substr(0, v.length - 1);
				}
				table = true;
			}
		} else if (typeof v === "string") {
			v = v.replace("\\", "\\\\");
			v = v.replace("\n", "\\n");
			v = v.replace("\"", "\\\"");
		}

		if (v === undefined || v === null) {
			continue;
		}
		if (typeof k === "number") {
			if (k === numeric) {
				numeric++;
				k = undefined;
			}
		}

		let str = "";
		for (let i = 0; i < indentation; i++) {
			str += "\t";
		}
		str += k === undefined ? "-" : `${k}:`;
		if (!options.minify && !table) {
			str += " ";
		}
		str += v.toString();
		if (outStr.length !== 0) {
			str = `\n${str}`
		}
		outStr += str;
	}
	return outStr;
}

function iSerialize(obj: any, indentation: number, objects: Object[], options: SSv2SerializationOptions, root=false) {
	let outStr = "";
	let numberKeys: number[] = [], stringKeys: string[] = [];
	let numericObject = obj;
	for (let k in obj) {
		if (!isNaN(k as any)) {
			numberKeys.push(parseInt(k));
		} else if (typeof k === "string") {
			stringKeys.push(k);
		}
	}
	if (obj._numeric) {
		numericObject = obj._numeric;
		obj._numeric = undefined;
		for (let [i, v] of numericObject.entries()) {
			if (v === undefined || v === null) {
				continue;
			}
			numberKeys.push(i);
		}
	}
	numberKeys.sort((a, b) => a - b);
	stringKeys.sort();
	outStr += printObject(numericObject, numberKeys, indentation, objects, options);
	if (outStr.length !== 0) {
		outStr += "\n";
	}
	outStr += printObject(obj, stringKeys, indentation, objects, options);
	if (!options.minify && root) {
		outStr += "\n";
	}
	return outStr;
}

export function serialize(obj: any, options: SSv2SerializationOptions={
	minify: false
}) {
	return iSerialize(obj, 0, [], options, true);
}

function evaluateValue(str: string, line: number) {
	if (!isNaN(str as any)) {
		return +str;
	} else if (str === "true" || str === "yes" || str === "y") {
		return true;
	} else if (str === "false" || str === "no" || str === "n") {
		return false;
	} else if (str === "null" || str === "nil") {
		return null;
	} else if (str.startsWith("'")) {
		str = str.substr(1, str.length - 1);
		if (str.length !== 1) {
			throw new Error(`character is not one character: line ${line}`);
		}
		return str;
	} else if (str.startsWith("\"")) {
		str = str.substr(2, str.length - 1);
	}
	str = str.replace("\\n", "\n");
	str = str.replace("\\\"", "\"");
	str = str.replace("\\\\", "\\");
	return str;
}

function getIndentation(line: string) {
	let i = 0;
	while (line.startsWith("\t")) {
		i += 1;
		line = line.substr(1);
	}
	return i;
}

function iDeserialize(lines: string[], index: number): [any, number] {
	if (lines.length === 0) {
		return [{}, index];
	}
	let first = lines[index];
	let indentation = getIndentation(first);
	let obj: any = {};
	let lastKey = undefined;
	let indexCount = 0;
	let i = index;
	let numericValues = [];
	while (i < lines.length) {
		let line = lines[i];
		let ind = getIndentation(line);

		let comment = line.indexOf("//");
		if (comment !== -1) {
			line = line.substr(0, comment);
		}
		line = line.trim();
		if (line.length === 0) {
			i++;
			continue;
		}
		if (ind < indentation) {
			if (Object.keys(obj).length === 0) {
				obj = numericValues;
			} else if (numericValues.length !== 0) {
				obj._numeric = numericValues;
			}
			return [obj, i];
		} else if (ind > indentation) {
			let [o, jump] = iDeserialize(lines, i);
			i = jump;
			if (lastKey === undefined) {
				numericValues[indexCount] = o;
				indexCount++;
			} else {
				if (typeof lastKey === "number") {
					numericValues[lastKey] = o;
				} else {
					obj[lastKey as any] = o;
				}
				lastKey = undefined;
			}
			continue;
		} else {
			if (line.startsWith("-")) {
				line = line.substr(1).trim();
				lastKey = undefined;
				if (line.length === 0) {
					lastKey = indexCount;
				}
				numericValues[indexCount] = evaluateValue(line, i);
				indexCount++;
			} else {
				let sections = line.split(":", 2);
				let k = sections[0];
				let v = sections[1];
				let key = evaluateValue(k.trim(), i);
				let value = evaluateValue(v.trim(), i);
				lastKey = key;
				if (typeof key === "number") {
					numericValues[key] = value;
				} else {
					obj[key as any] = value;
				}
			}
		}
		i++;
	}
	if (Object.keys(obj).length === 0) {
		obj = numericValues;
	} else if (numericValues.length !== 0) {
		obj._numeric = numericValues;
	}
	return [obj, lines.length];
}

export function deserialize(str: string) {
	let lines = str.split("\n");
	return iDeserialize(lines, 0)[0];
}
