import * as SSv2 from ".";

let test: any = {
	test2: {
		test3: {
			what: "is\nthis"
		}
	}
};

test.test = "hi tehre";
test.hmm = "hmm";
test[5] = 42;

let test2 = [1, 2, 3, 4];

console.log("Original");
console.log(test);
console.log(test2);

console.log("Serialization");
let result = SSv2.serialize(test);
console.log(result);

let result2 = SSv2.serialize(test2);
console.log(result2);

console.log("Deserialization");
let dResult = SSv2.deserialize(result);
console.log(dResult);

let dResult2 = SSv2.deserialize(result2);
console.log(dResult2);

console.log("Reserialization");
let rResult = SSv2.serialize(dResult);
console.log(rResult);

let rResult2 = SSv2.serialize(dResult2);
console.log(rResult2);

console.log("Redeserialization");
let rdResult = SSv2.deserialize(rResult);
console.log(rdResult);

let rdResult2 = SSv2.deserialize(rResult2);
console.log(rdResult2);
