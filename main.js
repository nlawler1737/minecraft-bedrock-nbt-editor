
class End {
    #bytes
    constructor(bytes) {
        this.#bytes = bytes.splice(0,1)
    }
    get bytes() {
        return this.#bytes
    }
}
class Byte {
    #bytes
    #value
    constructor(bytes) {
        this.#bytes = bytes.splice(0,this.tagInfo.bytesLength)
        this.#value = this.#bytesToDecimal(...this.#bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 1,
            tagId: 1,
            snbt: ["b","B"],
            max: 127,
            min: -128
        }
    }
    get bytes() {
        return this.#bytes
    }
    get value() {
        return this.#value
    }
    set value(e) {
        this.#bytes = this.#decimalToBytes(e).slice(0,this.tagInfo.bytesLength)
        this.#value = this.#bytesToDecimal(...this.#bytes)
    }
    get snbt() {
        return `${this.#value}${this.tagInfo.snbt[0]}`
    }
    static fromSNBT(value) {
        throw "- Not Implemented"
        const byte = new this(this.#decimalToBytes(value.toString().replace(new RegExp(`[${new this([]).tagInfo.snbt.join("")}]$`),"")))
        return byte
    }

    #bytesToDecimal(...nums) { // 2 1 -> 258
        let total = BigInt(0)
        let max = BigInt(0)
        let isNegative = nums[nums.length-1] >= 128
        for (let a = 0; a < nums.length; a++) {
            if (a === nums.length-1) {
                max += a === 0 ? BigInt(127) : BigInt(256**a * 127)
            } else {
                max += BigInt(256**a * 255)
            }
            if (a === 0) {
                total += BigInt(nums[a])
            } else  {
                total += BigInt(256**a * nums[a])
            }
        }
        if (isNegative) {
            let diff = total - (max + BigInt(1))
            let min = (max + BigInt(1)) * BigInt(-1)
            return (min + diff).toString()
        }
        return total.toString()
    }

    #decimalToBytes(num, bytesLength) { // 258 -> 2 1
        return Array.from(new Uint8Array(new Uint32Array([num]).buffer))
    }

    #tagData(id) {
        return [
            {id:0,value:"end",snbt:""},
            {id:1,value:"byte",snbt:"b"},
            {id:2,value:"short",snbt:"s"},
            {id:3,value:"int",snbt:""},
            {id:4,value:"long",snbt:"l"},
            {id:5,value:"float",snbt:"f"},
            {id:6,value:"double",snbt:"d"},
            {id:7,value:"byteArray",snbt:"B"},
            {id:8,value:"string"},
            {id:9,value:"list"},
            {id:10,value:"compound"},
            {id:11,value:"intArray",snbt:"I"},
            {id:12,value:"longArray",snbt:"L"}
        ][id]
    }
}
class Short extends Byte {
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 2,
            tagId: 2,
            snbt: ["s","S"],
            max: 32767,
            min: -32768
        }
    }
}
class Int extends Byte {
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 4,
            tagId: 3,
            snbt: ["","I"],
            max: 2147483647,
            min: -2147483648
        }
    }
}
class Long extends Byte {
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 8,
            tagId: 4,
            snbt: ["l","L"],
        }
    }
}
class ByteArray {
    #bytes
    #length
    #value = []
    constructor(bytes) {
        this.#length = new Int(bytes.splice(0,4))

        for (let i = 0; i < this.#length.value; i++) {
            const child = new (Tag.fromID(this.tagInfo.childId))(bytes)
            this.#value.push(child)
        }
        this.#bytes = this.bytes
    }
    get tagInfo() {
        return {
            bytesLength: 1,
            childId: 1,
            tagId: 7,
            snbt: ["B"]
        }
    }
    get bytes() {
        return [...this.#length.bytes,...this.#value.map(e=>e.bytes).reduce((a,b)=>a.concat(b),[])]
    }
    get value() {
        return this.#value
    }
    set value(e) {
        throw "- Not Implemented"
    }
}
class Float {
    #bytes
    #value
    constructor(bytes) {
        this.#bytes = bytes.splice(0,this.tagInfo.bytesLength)
        this.#value = this.#bytesToFloatOrDouble(this.#bytes).toFixed(45).replace(/.?0*$/,"")
    }

    get tagInfo() {
        return {
            bytesLength: 4,
            tagId: 5,
            snbt: ["f","F"],
            max: 3.4e38,
            min: -3.4e38
        }
    }
    
    get bytes() {
        return this.#bytes
    }
    get value() {
        return this.#value
    }
    set value(e) {
        throw "- Not Implemented"
    }

    #bytesToFloatOrDouble(bytes) {
        let dataView = new DataView(new ArrayBuffer(bytes.length))
        ![...bytes].reverse().forEach((a,b)=>{dataView.setUint8(b,a)})
        return bytes.length === 4 ? dataView.getFloat32(0) : bytes.length === 8 ? dataView.getFloat64(0) : null
    }

    #removeEndingZeros(string) {
        let strArr = string.split("")
        while (["0","."].includes(strArr[strArr.length-1])) {
            strArr.pop()
        }
        return strArr.join("")
    }
}
class Double extends Float{
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 8,
            tagId: 6,
            snbt: ["d","D"],
            max: 1.7e308,
            min: -1.7e308
        }
    }
}
class Str {
    #bytes
    #value
    #length
    constructor(bytes) {
        this.#length = new Short(bytes)
        this.#bytes = [...this.#length.bytes,...bytes.splice(0,Number(this.#length.value))]
        this.#value = this.#bytesToString(this.#bytes.slice(2))
    }
    get tagInfo() {
        return {
            tagId: 8,
        }
    }
    get bytes() {
        return [...this.#bytes]
    }
    get value() {
        return this.#value
    }
    set value(string) {
        let lengthShort = new Short([])
        lengthShort.value = string.length
        this.#length = lengthShort.value
        this.#value = string
        let strBytes = this.#value.split("").map(e=>e.charCodeAt(0))
        this.#bytes = [...lengthShort.bytes,...strBytes]
    }

    #bytesToString(bytes) {
        return [...bytes].map(e=>String.fromCharCode(e)).join("")
    }
    #stringToBytes(string) {
        return string.split("").map(e=>e.charCodeAt(0))
    }
}
class List {
    #bytes = []
    #length
    #value = []
    #tag
    constructor(bytes) {
        this.#bytes = bytes.splice(0,5)
        this.#tag = this.#bytes[0]
        this.#length = new Int([...this.#bytes.slice(1)])
        for (let i = 0; i < this.#length.value; i++) {
            let content = new (Tag.fromID(this.#tag))(bytes)
            this.#value.push(content)
            this.#bytes = [...this.#bytes,...content.bytes]
        }
    }

    get tagInfo() {
        return {
            tagId: 9,
        }
    }
    get bytes() {
        return this.#bytes
    }
    get value() {
        return this.#value
    }
    set value(e) {
        throw "- Not Implemented"
    }
}
class Compound {
    #bytes = []
    #value = []
    constructor(bytes) {

        while (!(this.#value[this.#value.length-1] instanceof End)) {
            if (bytes[0]===0) {
                this.#value.push(new End(bytes))
                this.#bytes = [...this.#bytes,0]
                continue
            }
            const {tag,key} = this.#getTagHeader(bytes)
            const value = new (Tag.fromID(tag))(bytes)
            this.#value.push({
                key,
                value
            })
            
            this.#bytes = [...this.#bytes, tag, ...key.bytes, ...value.bytes]

        }
    }
    
    get tagInfo() {
        return {
            tagId: 10,
        }
    }
    get bytes() {
        return this.#bytes
    }
    get value() {
        return this.#value
    }
    set value(e) {
        throw "- Not Implemented"
    }
    static addTag(tag) {
        throw "- Not Implemented"
        this.#value.push(tag)
    }

    #getTagHeader(bytes) {
        let tag = bytes.splice(0,1)[0]
        if (tag === 0) return { tag }
        let key = new Str(bytes)
        return {
            tag,
            key,
        }
    }
}
class IntArray extends ByteArray {
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 4,
            childId: 3,
            tagId: 11,
            snbt: ["I"]
        }
    }
}
class LongArray extends ByteArray {
    constructor(bytes) {
        super(bytes)
    }
    get tagInfo() {
        return {
            bytesLength: 8,
            childId: 4,
            tagId: 12,
            snbt: ["L"]
        }
    }
}
class Tag {
    static fromID(id,info=false) {
        let ids = info ?
        [
            this.end,
            this.byte,
            this.short,
            this.int,
            this.long,
            this.float,
            this.double,
            this.byteArray,
            this.string,
            this.list,
            this.compound,
            this.intArray,
            this.longArray
        ] :
        [
            End,
            Byte,
            Short,
            Int,
            Long,
            Float,
            Double,
            ByteArray,
            Str,
            List,
            Compound,
            IntArray,
            LongArray,
        ]

        return ids[id]

    }
    static end = {
        name: "end",
        bytes: 1
    }
    static byte = {
        name: "byte",
        bytes: 1
    }
    static short = {
        name: "short",
        bytes: 2
    }
    static int = {
        name: "int",
        bytes: 4
    }
    static long = {
        name: "long",
        bytes: 8
    }
    static float = {
        name: "float",
        bytes: 4
    }
    static double = {
        name: "double",
        bytes: 8
    }
    static string = {
        name: "string",

    }
    static byteArray = {
        name: "byteArray",

    }
    static intArray = {
        name: "intArray",

    }
    static longArray = {
        name: "longArray",

    }
    static compound = {
        name: "compound",

    }
    static list = {
        name: "list",

    }
}
class NBT {
    #bytes = []
    #fileData = []
    #fileBody = []
    #value = []
    /**
     * Parses little-endian bytes from Minecraft Bedrock Edition's level.data file
     * @param {number[]} bytes Array of base 16 bytes
     */
    constructor (bytes) {
        this.#bytes = bytes
        this.#fileData = this.#bytes.slice(0,8)
        this.#fileBody = this.#bytes.slice(8)
        this.#fileBody.splice(0,1)
        this.#value.push({
            key: new Str(this.#fileBody),
            value:new Compound(this.#fileBody)
    })
    }

    get bytes(){
        return this.#bytes
    }
    get value() {
        return [...this.#value]
    }

    static parse(value) {
        throw "- Not Implemented"
        let num
        let i = 0
        const match = {
            key: /^([0-9A-Za-z.+_-]+) *:/,
            num: /^(\d+(\.\d*)?)(\w?)/
        }

        function skipWhitespace () {
            while (i < value.length && [" ", "\n", "\r"].includes(value[i]))
                i++
        }
        function getValue () {
            skipWhitespace()
            if (i == value.length) return null
            if (value[i] == "{") return compound()
            else if (num = value.slice(i,value.length).match(match.num)) {
                num = [num[1],num[3]]
                if (num[0][num[0].length-1] === ".") num[0] = num[0].slice(0,num[0].length-1)
                if (["b","B"].includes(num[1])) return byte()
                else if (["s","S"].includes(num[1])) return short()
                else if (["l","L"].includes(num[1])) return long()
                else if (["f","F"].includes(num[1])) return float()
                else if (["d","D"].includes(num[1])) return double()
                else {
                    if (num[1]) {
                        i += num[0].length
                        throw error("Invalid SNBT tag")
                    }
                    return int()
                }
                
            }
            return
        }

        function getName () {
            const string = value.slice(i, value.length)
            const key = string.match(match.key)
            if (!Array.isArray(key) || !key[1])
                throw error("Invalid Key")
            i += key[1].length
            // i++
            return key[1]
        }

        function byte () {}
        function short () {}
        function int () {
            i+= num.join("").length
            // i++
            return num.join("")
        }
        function long () {}
        function float () {}
        function double () {}
        function string () {}
        function byteArray () {}
        function intArray () {}
        function longArray () {}
        function compound () {
            let children = {}
            i++
            skipWhitespace()
            if (value[i] === "}") {
                i++
                return children
            }
            while (true) {
                const key = getName()
                skipWhitespace()
                if (value[i] != ":")
                    throw error("Expecting ':'")
                i++
                skipWhitespace()
                children[[key[0]]] = getValue()
                skipWhitespace()
                if (value[i] == ",") {
                    i++
                    skipWhitespace()
                } else
                    break;
            }
            if (value[i] != "}") {
                throw error("Expecting '}'")
            }
            i++
            return children
        }
        function list () {}
        function t (a) {
            let b = [i, value[i]]
            a ? b.unshift(a) : null
        }
        function error (err) {
            const a = Math.max(i - 10, 0)
            const b = i + 10
            const c = value.slice(a, b)
            const d = " ".repeat(i - a) + "^"
            const indent = "  "
            const spacing = "\n"
            const e = spacing + indent + [err ? "--" + err + "--" : "", "Error at :", "character : " + i, c + "\n" + indent + d].join(spacing + indent) + "\n"
            return new Error(e)
        }

        return getValue()
    }
}