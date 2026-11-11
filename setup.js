let DB = [];
let CURRENT = 0;
let LANG = "pt";
let LAYOUT = [];
let DRAG_SOURCE = null;
let GRID = null;


const T = {
    pt: {
        agenda_base: "Agenda Base",
        agenda_sonda: "Agenda Sonda",
        codigo: "Código do Requisito",
        requisito: "Requisito",
        requisitominimo: "Requisito Mínimo",
        orientacoes: "Orientações",
        autoavaliacao: "Autoavaliação",
        autoavaliacaodt: "Autoavaliação Detalhada",
        auditado: "Auditado",
        apoio: "Apoio"
    },
    en: {
        agenda_base: "Base Schedule",
        agenda_sonda: "Rig Schedule",
        codigo: "Requirement Code",
        requisito: "Requirement",
        requisitominimo: "Minimum Requirement",
        orientacoes: "Guidelines",
        autoavaliacao: "Self Assessment",
        autoavaliacaodt: "Detailed Self Assessment",
        auditado: "Auditee",
        apoio: "Support"
    }
};

function showError(text) {

    try {

        document.getElementById("errorText").innerText = text;
        document.getElementById("errorModal").style.display = "block";

    } catch (e) {

        alert(text);

    }

}

function closeError() {

    try {

        document.getElementById("errorModal").style.display = "none";

    } catch (e) {

        alert(e);

    }

}

async function loadLayout() {

    try {

        const r = await fetch(
            "/api/layout/load"
        );

        if (!r.ok) {
            LAYOUT = [];
            return;
        }

        const data = await r.json();

        LAYOUT = data.fields || [];

    } catch (e) {

        LAYOUT = [];

        showError(
            e.stack || e
        );

    }

}

async function saveLayout() {

    try {

        if (!GRID) return;

        const layout = [];

        GRID.engine.nodes.forEach(node => {

            const field =
                node.el.dataset.field;

            layout.push({

                field: field,

                x: node.x,
                y: node.y,

                w: node.w,
                h: node.h

            });

        });

        LAYOUT = layout;

        GRID.float(false);

        GRID.compact();

        console.log(
            "SALVANDO",
            layout
        );

        await fetch(
            "/api/layout/save",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    fields: layout
                })
            }
        );

    } catch (e) {

        showError(
            e.stack || e
        );

    }

}

function getFieldLayout(field) {

    const item =
        LAYOUT.find(
            x => x.field === field
        );

    if (item) return item;

    return {
        x: 0,
        y: 0,
        w: 6,
        h: 3
    };

}

function enableDragLayout() {

    try {

        const cards = document.querySelectorAll(".field-card");

        cards.forEach(card => {

            card.draggable = true;

            card.addEventListener("dragstart", function () {

                DRAG_SOURCE = this;

                this.classList.add("opacity-50");

            });

            card.addEventListener("dragend", function () {

                this.classList.remove("opacity-50");

            });

            card.addEventListener("dragover", function (e) {

                e.preventDefault();

            });

            card.addEventListener("drop", async function (e) {

                try {

                    e.preventDefault();

                    const target = this;

                    if (!DRAG_SOURCE) return;

                    if (DRAG_SOURCE === target) return;

                    const parent = target.parentNode;

                    parent.insertBefore(
                        DRAG_SOURCE,
                        target
                    );

                    await saveLayout();

                } catch (err) {

                    showError(err.stack || err);

                }

            });

        });

    } catch (e) {

        showError(e.stack || e);

    }

}

async function loadData() {

    try {

        await loadLayout();

        let r = await fetch("/api/records");

        let d = await r.json();

        DB = d.records || [];

        renderCodes();

        renderRecord();

    } catch (e) {

        showError(e.stack || e);

    }

}

function toggleLanguage() {

    try {

        LANG = LANG === "pt"
            ? "en"
            : "pt";

        renderRecord();

    } catch (e) {

        showError(e.stack || e);

    }

}

function getFieldOrder(record) {

    const fields = Object.keys(record);

    if (!LAYOUT || !LAYOUT.length) {
        return fields;
    }

    const ordered = [];

    LAYOUT.forEach(item => {

        if (
            item.field &&
            fields.includes(item.field)
        ) {
            ordered.push(item.field);
        }

    });

    fields.forEach(field => {

        if (!ordered.includes(field)) {
            ordered.push(field);
        }

    });

    return ordered;

}

function renderRecord() {

    try {

        if (DB.length === 0) {

            document.getElementById(
                "recordArea"
            ).innerHTML =
                "<div class='alert alert-warning'>Nenhum registro carregado.</div>";

            return;

        }

        const record =
            DB[CURRENT];

        const fields =
            getFieldOrder(record);

        const area =
            document.getElementById(
                "recordArea"
            );

        area.innerHTML = "";

        if (GRID) {
            GRID.destroy(false);
        }

        GRID = GridStack.init({
            column: 12,
            float: true,
            cellHeight: 90,
            margin: 8,
            animate: true,
            resizable: {
                handles:
                    "e,se,s,sw,w"
            }
        });

        const codesWrapper = document.createElement("div");

        codesWrapper.className = "grid-stack-item";
        codesWrapper.dataset.field = "codigos_requisito";

        codesWrapper.innerHTML = `
        <div class="grid-stack-item-content">
        <div class="field-card">
        <div class="d-flex justify-content-between align-items-center">
        <strong>Códigos do Requisito</strong>
        </div>

        <div class="mt-2">
        <div id="codesTable" class="codes-grid"></div>
        </div>
        </div>
        </div>
        `;

        area.appendChild(codesWrapper);

        const codesLayout =
        getFieldLayout("codigos_requisito");

        fields.forEach(field => {



            GRID.makeWidget(
                codesWrapper,
                {
                    x: codesLayout.x,
                    y: codesLayout.y,
                    w: codesLayout.w || 12,
                    h: codesLayout.h || 4
                }
            );


            const cfg =
                getFieldLayout(
                    field
                );

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "grid-stack-item";

            wrapper.dataset.field =
                field;

            wrapper.innerHTML = `

            <div class="grid-stack-item-content">

                <div class="field-card">

                    <div class="d-flex justify-content-between align-items-center">

                        <strong>
                            ${T[LANG][field] || field}
                        </strong>

                        <i
                            class="fa fa-pencil edit-icon"
                            id="icon_${field}"
                            onclick="toggleEdit('${field}')"></i>

                    </div>

                    <textarea
                        class="form-control mt-2"
                        id="${field}"
                        readonly>${record[field] || ""}</textarea>

                </div>

            </div>

            `;

            area.appendChild(
                wrapper
            );

            GRID.makeWidget(
                wrapper,
                {
                    x: cfg.x,
                    y: cfg.y,
                    w: cfg.w,
                    h: cfg.h
                }
            );

        });

       
        GRID.on("dragstop", saveLayout);

        GRID.on( "resizestop", saveLayout);

        renderCodes();


    } catch (e) {

        showError(
            e.stack || e
        );

    }

}

function renderCodes() {
    try {

        const table =
            document.getElementById(
                "codesTable"
            );

        if (!table) return;

        let html = "";

        DB.forEach((r, i) => {

            html += `
            <div
                class="code-item"
                data-index="${i}"
                onclick="gotoRecord(${i})">

                ${r.codigo || ("Registro " + (i + 1))}

            </div>
            `;
        });

        table.innerHTML = html;

    } catch (e) {
        showError(e.stack || e);
    }
}

function gotoRecord(i) {

    try {

        CURRENT = i;

        renderRecord();

    } catch (e) {

        showError(e.stack || e);

    }

}

async function toggleEdit(field) {

    try {

        const box =
            document.getElementById(field);

        const icon =
            document.getElementById(
                "icon_" + field
            );

        if (box.readOnly) {

            box.readOnly = false;

            box.focus();

            icon.className = "fa fa-save edit-icon";

        } else {

            const response =
                await fetch(
                    "/api/update",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            index: CURRENT,
                            field: field,
                            value: box.value
                        })
                    }
                );

            const result =
                await response.json();

            if (result.error) {

                throw result.error;

            }

            DB[CURRENT][field] =
                box.value;

            box.readOnly = true;

            icon.className =
                "fa fa-pencil edit-icon";

        }

    } catch (e) {

        showError(e.stack || e);

    }

}

async function uploadExcel() {

    try {

        document
            .getElementById(
                "progressModal"
            ).style.display = "block";

        const file =
            document.getElementById(
                "excelFile"
            ).files[0];

        if (!file) {

            throw new Error(
                "Selecione um arquivo Excel."
            );

        }

        const form =
            new FormData();

        form.append(
            "file",
            file
        );

        let progress = 0;

        const timer =
            setInterval(() => {

                progress += 10;

                if (progress > 95) {

                    progress = 95;

                }

                const bar =
                    document.getElementById(
                        "progressBar"
                    );

                bar.style.width =
                    progress + "%";

                bar.innerText =
                    progress + "%";

            }, 150);

        const r =
            await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: form
                }
            );

        clearInterval(timer);

        const bar =
            document.getElementById(
                "progressBar"
            );

        bar.style.width = "100%";
        bar.innerText = "100%";

        const data =
            await r.json();

        if (data.error) {

            throw data.error;

        }

        setTimeout(() => {

            document
                .getElementById(
                    "progressModal"
                ).style.display = "none";

        }, 500);

        await loadData();

    } catch (e) {

        document
            .getElementById(
                "progressModal"
            ).style.display = "none";

        showError(
            e.stack || e
        );

    }

}

window.onerror = function (
    message,
    source,
    lineno,
    colno,
    error
) {

    try {

        showError(
            "JavaScript Error\n\n" +
            message +
            "\n\nArquivo: " + source +
            "\nLinha: " + lineno +
            "\nColuna: " + colno +
            "\n\n" +
            (error ? error.stack : "")
        );

    } catch (e) {

        alert(message);

    }

    return true;
};

loadData();
