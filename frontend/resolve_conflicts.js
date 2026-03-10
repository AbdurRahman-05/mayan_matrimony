import fs from 'fs';

function acceptTheirs(filePath) {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    // Regex logic: Find <<<<<<< HEAD ... ======= ... >>>>>>> e948d6c (changes)
    // We want to KEEP the content between ======= and >>>>>>> e948d6c (changes)

    // Non-greedy match for everything from <<<<<<< HEAD to =======
    // Then capture everything up to >>>>>>> e948d6c (changes)
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> e948d6c \(changes\)[ \t]*\r?\n?/g;

    const newContent = content.replace(regex, (match, headContent, theirsContent) => {
        return theirsContent;
    });

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Replaced markers in ${filePath}`);
}

acceptTheirs('c:/Matrimony/frontend/src/pages/Register.jsx');
acceptTheirs('c:/Matrimony/frontend/src/pages/Home.jsx');
acceptTheirs('c:/Matrimony/frontend/src/pages/Profile.jsx');
