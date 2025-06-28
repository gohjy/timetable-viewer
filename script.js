let isLoaded = false;

const yearInput = document.querySelector("#yearInput");
const sem1Input = document.querySelector("#sem1");
const sem2Input = document.querySelector("#sem2");
const whichSem = () => sem1Input.checked ? 1 : (sem2Input.checked ? 2 : null);
const classInput = document.querySelector("#classInput");

const getData = async (day, year, sem) => {
    let data = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-timetable-data@latest/${year}s${sem}/day/${day}.json`).catch((e) => {
        alert("Your network isn't good!");
        throw e;
    });
    let dataJson = await data.json().catch((e) => {
        alert("The data for the timetable cannot be found!");
        throw e;
    });

    console.log("DATA JSON")
    console.log(dataJson)

    if (dataJson) return dataJson;
    else throw new Error("getData went wrong");
}

const data = [];
const metadata = {
    "year": null,
    "sem": null
}

const putData = async (year, sem) => {
    metadata.year = year;
    metadata.sem = sem;

    while (data.length !== 0) data.pop();
    for (let i=1; i<=5; i++) {
        console.log("EE" + i)
        data.push(await getData(i, year, sem));
    }
}

// await putData(new Date().getFullYear(), Math.floor((new Date().getMonth()+5)/6));

console.log(data);

const remap = {
    "INTHUM": "Hum",
    "RC": "Recess",
    "LUN": "Lunch",
    "FREE": " ",
    "PHYS": "Phy",
    "BIO": "Bio",
    "CHEM": "Chem",
    "MEN": "Mentr",
    "HON": "Honours",
    "THIRDLANG": "3rd Lang",
    "ART": "Art",
    "MU": "Music",
    "ELEC": "Elective",
    "ELC": "Elective"
}

const config = {
    "ELEC": {
        maxlength: 3
    },
    "FREE": {
        maxlength: 1
    },
    "": {
        maxlength: 1
    }
}

const gridBoxes = [];
const contentBox = document.querySelector("#main-table-content");

for (let i=0; i<5; i++) {
    let row = contentBox.children[i];
    let boxesRow = [];
    for (let j=1; j<=20; j++) {
        boxesRow.push(row.children[j]);
    }
    gridBoxes.push(boxesRow);
}

async function loadTimetable(classId, year, sem) {
    await putData(year, sem);
    console.log(data);
    for (let i=0; i<5; i++) {
        const row = gridBoxes[i];
        const rowData = data[i].data.find(x => x.class === classId);
        if (!rowData) {
            alert("Sorry, could not load table.")
            return;
        }
        console.log(rowData);
        for (let j=0; j<20; j++) {
            const value = rowData[`p${j + 1}`].subject.trim();
            row[j].textContent = remap[value] || value.replaceAll(",","/");

            let colspan = 1;
            let len = 1;
            console.log(value === rowData[`p${j + 1 + len}`]?.subject);
            while (value === rowData[`p${j + 1 + len}`]?.subject && row.length + 1> j+1+len) {
                if (colspan >= config[value]?.maxlength) break;
                console.log(0);
                colspan++;
                row[j + len].classList.add("invisible");
                row[j + len].textContent = row[j].textContent;
                len++;
            }
            row[j].setAttribute("colspan", colspan);
            row[j].classList.remove("invisible");
            j += (len - 1);
        }
    }

    document.querySelector("#class").textContent = `${classId}, ${year} Sem ${sem}`;
    isLoaded = true;
}

const evHandler = async (ev) => {
    // Manually override for now
    yearInput.value = 2025;
    sem1Input.checked = true;
    
    let classNum = +classInput.value;
    if (!classNum || classNum % 1 !== 0 || classNum % 100 > 7 || (classNum % 100 > 6 && classNum < 301) || classNum % 100 === 0 || classNum > 607 || classNum < 101) {
        alert("Invalid class!");
        if (!isLoaded) {
            const searchParams = new URL(location.href).searchParams;
            searchParams.delete("class");
            location.search = searchParams;
        }
        return;
    };

    try { await loadTimetable(classNum, +yearInput.value, whichSem()); }
    catch(e) { void e; }
}

/* classInput.addEventListener("change", evHandler);
yearInput.addEventListener("change", evHandler);
sem1Input.addEventListener("change", evHandler);
sem2Input.addEventListener("change", evHandler);

document.querySelector("#goBtn").addEventListener("click", () => {
    document.querySelector("#classInput").dispatchEvent(new InputEvent("change"));
}); */

document.querySelector("#mainform").addEventListener("submit", (ev) => {
    ev.preventDefault();
    evHandler();
})

const urlObj = new URL(location.href).searchParams;

const starter = +urlObj.get("class");
if (starter) {
    document.querySelector("#classInput").value = starter;
    yearInput.value = +urlObj.get("year") || new Date().getFullYear();
    if (urlObj.get("sem")) {
        if (+urlObj.get("sem") === 1) sem1Input.checked = true;
        else if (+urlObj.get("sem") === 2) sem2Input.checked = true;
        else if (Math.floor((new Date().getMonth()+5)/6) > 1) {
            sem2Input.checked = true;
        } else {
            sem1Input.checked = true;
        }
    } else if (Math.floor((new Date().getMonth()+5)/6) > 1) {
        sem2Input.checked = true;
    } else {
        sem1Input.checked = true;
    }
    
    document.querySelector("#goBtn").click();
}