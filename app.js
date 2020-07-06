import { SVGBox } from "./SVGBox.js";
import { getRandomColorStringHSV } from "./help_functions.js";


// Layout
document.querySelector("#chk_left").addEventListener("input", updateGrid);
document.querySelector("#chk_right").addEventListener("input", updateGrid);
function updateGrid() {
    const left = document.querySelector("#chk_left").checked;
    const right = document.querySelector("#chk_right").checked;
    let areas = "";

    if (left && right) {
        areas = `
        "${'bar '.repeat(12)}"
        "tools tools c c c c c c json json json json"
        "layers layers c c c c c c note note note note"`;
    } else if (left) {
        areas = `
        "${'bar '.repeat(12)}"
        "tools tools ${'c '.repeat(10)}"
        "layers layers ${'c '.repeat(10)}"`;
    } else if (right) {
        areas = `
        "${'bar '.repeat(12)}"
        "${'c '.repeat(9)} json json json json"
        "${'c '.repeat(9)} note note note note"`
    } else {
        areas = `
        "${'bar '.repeat(12)}"
        "${'c '.repeat(12)}"
        "${'c '.repeat(12)}"`
    }

    if (left) {
        document.querySelector("#layer_list").style.display = "block";
        document.querySelector("#toolbox").style.display = "block";
    } else {
        document.querySelector("#layer_list").style.display = "none";
        document.querySelector("#toolbox").style.display = "none";
    }
    if (right) {
        document.querySelector("#json_editor").style.display = "block";
        document.querySelector("#note_editor").style.display = "block";
    } else {
        document.querySelector("#json_editor").style.display = "none";
        document.querySelector("#note_editor").style.display = "none";
    }

    document.querySelector("#gridcontainer").style.gridTemplateAreas = areas;
}



// Toolbox
document.querySelector("#btn_circle").addEventListener("click", function(event) {
    SVG_Box.addCustomSVGElement({
        "tag": "circle",
        "r": 15,
        "fill": getRandomColorStringHSV(undefined, 1, 1),
    })
})

document.querySelector("#btn_rect").addEventListener("click", function(event) {
    SVG_Box.addCustomSVGElement({
        "tag": "rect",
        "width": 30,
        "height": 30,
        "fill": getRandomColorStringHSV(undefined, 1, 1),
    })
})

document.querySelector("#btn_zoomin").addEventListener("click", function(event) {
    SVG_Box.zoomIn();
})
document.querySelector("#btn_zoomout").addEventListener("click", function(event) {
    SVG_Box.zoomOut();
})




function setupJSONEditor() {
    const container = document.getElementById("json_editor")
    const options = {
        modes: ['tree', 'code', 'text', 'view'],
        onChange: function() {
            const json = editor.get();
            SVG_Box.updateObject(json.id, json);
            notes.value = SVG_Box.objects[json.id].note;
        }
    }
    const editor = new JSONEditor(container, options)
    editor.set(undefined);

    return editor;
}


const svg_box = document.querySelector("#svg_box");
let SVG_Box = new SVGBox(svg_box);

const notes = document.querySelector("#txt_note");
notes.addEventListener("input", function(event) {
    let json = editor.get();
    json.note = notes.value;
    SVG_Box.updateObject(json.id, json);
    editor.set(json);
})

SVG_Box.selectfunction = function(id) {
    editor.set(SVG_Box.objects[id]);
    notes.value = SVG_Box.objects[id].note;
}
SVG_Box.dragfunction = function(id) {
    editor.set(SVG_Box.objects[id]);
}
SVG_Box.enddragfunction = function(id) {
    editor.set(SVG_Box.objects[id]);
}
SVG_Box.deselectfunction = function(id) {
    editor.set(undefined);
    notes.value = "";
}




let editor = setupJSONEditor();
// const updatedJson = editor.get()