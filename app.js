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
        "${'c '.repeat(10)} json json"
        "${'c '.repeat(10)} note note"`
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

const e_svg_box = document.querySelector("#svg_box");
let SVG_Box = new SVGBox(e_svg_box);

const e_title = document.querySelector("#txt_title")
const e_notes = document.querySelector("#txt_note");

e_title.addEventListener("input", function(event) {
    let json = JSONeditor.get();
    json.title = e_title.value;
    SVG_Box.updateObject(json.id, json);
    JSONeditor.set(json);
})
e_notes.addEventListener("input", function(event) {
    let json = JSONeditor.get();
    json.note = e_notes.text;
    SVG_Box.updateObject(json.id, json);
    JSONeditor.set(json);
})

SVG_Box.selectfunction = function(id) {
    JSONeditor.set(SVG_Box.objects[id]);
    e_title.value = SVG_Box.objects[id].title;
    e_notes.value = SVG_Box.objects[id].note;
}
SVG_Box.dragfunction = SVG_Box.resizefunction = SVG_Box.enddragfunction = SVG_Box.endresizefunction = function(id) {
    JSONeditor.set(SVG_Box.objects[id]);
}
SVG_Box.deselectfunction = function(id) {
    JSONeditor.set(undefined);
    e_title.value = "";
    e_notes.value = "";
}

function setupJSONEditor() {
    const container = document.getElementById("json_editor")
    const options = {
        modes: ['tree', 'code', 'text', 'view'],
        onChange: function() {
            const json = editor.get();
            SVG_Box.updateObject(json.id, json);
            e_notes.value = SVG_Box.objects[json.id].note;
            e_title.value = SVG_Box.objects[json.id].title;
        }
    }
    const editor = new JSONEditor(container, options)
    editor.set(undefined);

    return editor;
}

let JSONeditor = setupJSONEditor();
// const updatedJson = editor.get()
