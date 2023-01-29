const root = document.querySelector(":root")
document.querySelector("#zoomIn").onclick = function () {
    var rs = getComputedStyle(root);
    // alert("The value of --blue is: " + rs.getPropertyValue('--blue'));
    root.style.setProperty("--scale",+rs.getPropertyValue("--scale")+0.1)
}
document.querySelector("#zoomOut").onclick = function () {
    var rs = getComputedStyle(root);
    // alert("The value of --blue is: " + rs.getPropertyValue('--blue'));
    root.style.setProperty("--scale",+rs.getPropertyValue("--scale")-0.1)
}

const fileInput = document.querySelector("#fileInput")

fileInput.oninput = function() {
    // main("#fileInput","#fileOutput")
    fromFile("#fileInput","#fileOutput")
}
// fetch("/level2.dat").then(data=>{
//     main("#fileInput","#fileOutput",data)
// })

fetch("/level.dat").then(data=>{
    fromFile("","#fileOutput",data)
    // data.arrayBuffer().then(buff=>{
    //     let nbt = new NBT(Array.from(new Uint8Array(buff)))
    //     console.log(nbt)
    // })
})

function fromFile(inputSelector, outputSelector, dataFromFileUrl=undefined) { //Browser
    const file = dataFromFileUrl || document.querySelector(inputSelector).files[0]
    const name = file.name || decodeURI(file.url).match(/[\w\-. ]+$/)[0]
    console.log(name)
    file.arrayBuffer().then(buffer=>{
        let nbt = new NBT(Array.from(new Uint8Array(buffer)))
        displayNBT(nbt,name)
        // console.log(nbt)
    })
}

function displayNBT(nbt,name) {
    // console.log(nbt)
    // console.log(nbt.value[0].value instanceof Compound)
    const compound = nbt.value[0]
    let html = new Element(compound, new Compound([0]),name).html
    // console.log(html)
    let nbtTree = document.querySelector("#tree")
    nbtTree.innerHTML = ""
    nbtTree.append(html)
    
}



/* 

    has extender/children -- is compound list array

    has key -- child of compound



    + icon name -- group header
    icon name value -- compound element
    icon value -- single element

*/

class Element {
    #element
    #htmlElement
    constructor(element,parent,name = undefined) {

        let container, header, body, extender, icon, key, value

        this.#element = element
        
        const isContainer = (
            this.#element.value instanceof Compound ||
            this.#element.value instanceof List ||
            this.#element.value instanceof ByteArray
        )
        const isList = (
            this.#element.value instanceof List ||
            this.#element.value instanceof ByteArray
        )
        const isTag = (
            parent instanceof List ||
            parent instanceof ByteArray
        )

        const isCompoundChild = parent instanceof Compound

        container = document.createElement("div")
        container.classList = "container"
        
        header = document.createElement("div")
        header.classList = "header"
        header.onclick = toggleHighlight
        if (isContainer) header.ondblclick = toggleCollapse

        icon = document.createElement("span")
        icon.classList = `icon ${getIcon(isTag ? this.#element.tagInfo.tagId : this.#element.value.tagInfo.tagId)}`

        value = document.createElement("div")
        value.classList = "value"
        
        container.append(header)
        
        if (isContainer) {
            extender = document.createElement("span")

            extender.classList = "inline collapseButton center"
            extender.setAttribute("data-content",name?"-":"+")
            extender.onclick = toggleCollapse
            header.append(extender)
            
            body = document.createElement("div")
            body.classList = `body ${name ? "" : "collapse"}`

            for (let i of this.#element.value.value) {
                if (i instanceof End) break
                const child = new Element(i,this.#element.value)
                body.append(child.html)
            }
            
            container.append(body)
        }
        
        header.append(icon)

        if (isCompoundChild) {
            key = document.createElement("div")
            key.innerText = name ? name : this.#element.key.value
            key.classList = "key"
            header.append(key)

            if (isContainer) {
                let length = this.#element.value.value.length
                value.innerText = `[${isList ? length : length-1} elements]`
            } else {
                value.innerText = this.#element.value.value
            }
        }

        if (isTag) {
            value.innerText = this.#element.value
        }

        header.append(value)

        this.#htmlElement = container
        
        function toggleCollapse() {
            if (body.classList.contains("collapse")) {
                body.classList.remove("collapse")
                extender.setAttribute("data-content","-")
            } else {
                body.classList.add("collapse")
                extender.setAttribute("data-content","+")
            }
        }
    }

    get html() {
        return this.#htmlElement
    }
}


function toggleHighlight(e) {
    let header = e.target.closest(".header")
    document.querySelectorAll(".highlight").forEach(e=>e.classList.remove("highlight"))
    header.classList.add("highlight")
    
}


function getIcon(id) {
    return [
        "end",
        "icon-byte",
        "icon-short",
        "icon-int",
        "icon-long",
        "icon-float",
        "icon-double",
        "icon-byteArr",
        "icon-string",
        "icon-list",
        "icon-compound",
        "icon-intArr",
        "icon-longArr",
    ][id]
}