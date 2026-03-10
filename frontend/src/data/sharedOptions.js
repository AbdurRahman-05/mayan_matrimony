// Options shared between Registration and Profile components for consistency

export const profileManagedOptions = ['Self', 'Parent', 'Sibling', 'Relative/Friend', 'Marriage Bureau', 'Other'];
export const genderOptions = ['Male', 'Female'];
export const maritalOptions = ['Never Married', 'Awaiting Divorce', 'Divorced', 'Widowed', 'Annulled', 'Married'];
export const booleanOptions = ['Yes', 'No'];
export const childrenCountOptions = ['1', '2', '3', '4+'];
export const physicalStatusOptions = ['Normal', 'Physically Challenged'];
export const disabilityOptions = ['None', 'Physically disabled from birth', 'Physically disabled due to accident', 'Mentally disabled from birth', 'Mentally disabled due to accident'];

export const heights = [
    "4ft 5in (134 cm)", "4ft 6in (137 cm)", "4ft 7in (139 cm)", "4ft 8in (142 cm)", "4ft 9in (144 cm)",
    "4ft 10in (147 cm)", "4ft 11in (149 cm)", "5ft (152 cm)", "5ft 1in (154 cm)", "5ft 2in (157 cm)",
    "5ft 3in (160 cm)", "5ft 4in (162 cm)", "5ft 5in (165 cm)", "5ft 6in (167 cm)", "5ft 7in (170 cm)",
    "5ft 8in (172 cm)", "5ft 9in (175 cm)", "5ft 10in (177 cm)", "5ft 11in (180 cm)", "6ft (182 cm)",
    "6ft 1in (185 cm)", "6ft 2in (187 cm)", "6ft 3in (190 cm)", "6ft 4in (193 cm)", "6ft 5in (195 cm)",
    "6ft 6in (198 cm)", "6ft 7in (200 cm)", "6ft 8in (203 cm)", "6ft 9in (205 cm)", "7ft (213 cm)"
];

export const religions = [
    "Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Inter-Religion", "No Religion"
];

export const horoscopes = [
    "Mesham (Aries)", "Rishabam (Taurus)", "Mithunam (Gemini)", "Kadagam (Cancer)", "Simmam (Leo)", "Kanni (Virgo)",
    "Thulam (Libra)", "Viruchigam (Scorpio)", "Dhanusu (Sagittarius)", "Magaram (Capricorn)", "Kumbam (Aquarius)", "Meenam (Pisces)"
];

export const educationOptions = [
    { isHeader: true, label: 'Engineering/Technology/Design' },
    "B.E/B.Tech", "B.Pharma", "M.E/M.Tech", "M.Pharma", "M.S. (Engineering)", "B.Arch", "M.Arch", "B.Des", "M.Des", "B.FAD", "B.FTech", "BID", "B.Tech LL.B.", "M.FTech", "MID", "MIB", "M.Plan", "MPH", "A.M.E.", "CISE", "ITIL",
    { isHeader: true, label: 'Management' },
    "MBA/PGDM", "BBA", "BHM", "BAM", "BBM", "BFM", "BFT", "B.H.A.", "BHMCT", "BHMTT", "BMS", "MAM", "MHA", "MMS", "MMM", "MTM", "MTA", "MHRM", "MBM", "Executive MBA", "CWM",
    { isHeader: true, label: 'Medicine/Health' },
    "MBBS", "M.D.", "BAMS", "BHMS", "BDS", "M.S. (Medicine)", "MVSc.", "BVSc.", "MDS", "BPT", "MPT", "DM", "MCh", "BCVT", "BMLT", "BMRIT", "BMRT", "BNYS", "BOT", "B.O.Th", "BOPTM", "BPMT", "B.P.Ed", "B.P.E.S",
    { isHeader: true, label: 'Computers' },
    "MCA", "BCA", "B.IT", "MCM", "PGDCA", "DCA", "ADCA",
    { isHeader: true, label: 'Finance/Commerce/Economics' },
    "B.Com", "CA", "CS", "ICWA", "M.Com", "CFA", "BBI", "BBE", "B.Com (Hons)", "MBE", "MBF", "MFC",
    { isHeader: true, label: 'Arts/Science' },
    "B.A", "B.Sc", "M.A", "M.Sc", "B.Ed", "M.Ed", "MSW", "BFA", "MFA", "BJMC", "MJMC", "B.Agri", "B.A. (Hons)", "BCT & CA", "B.El.Ed", "B.F.Sc.", "B.J", "B.Lib.I.Sc.", "B.Lib.Sc", "B.Litt", "ETT", "TTC", "P.P.T.T.C",
    { isHeader: true, label: 'Doctorate' },
    "PhD", "M.Phil", "LL.D.", "D.Litt", "Pharm.D", "FPM",
    { isHeader: true, label: 'Non-Graduate' },
    "Diploma/Certificate", "Class XII", "Trade School", "Class X or Below",
    { isHeader: true, label: 'Other' },
    "Other"
];

export const employedInOptions = ["Private Sector", "Government/Public Sector", "Civil Service", "Defense", "Business/Self Employed", "Not Working", "Student", "Retired", "Other"];

export const occupations = ["Software Professional", "Manager", "Engineer", "Doctor", "Teacher", "Banker", "Civil Services", "Business Owner", "Accountant", "Administrator", "Architect", "Consultant", "Designer", "Lawyer", "Marketing Professional", "Pharmacist", "Sales Professional", "Writer/Editor", "Actor/Model", "Student", "Retired", "Other"];

export const currencies = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "MYR", "LKR"];

export const languages = ["Tamil", "English", "Telugu", "Malayalam", "Kannada", "Hindi", "Marathi", "Bengali", "Gujarati", "Urdu", "Punjabi", "Odia"];

export const incomes = [
    "No Income", "Rs. 0 - 1 Lakh", "Rs. 1 - 2 Lakh", "Rs. 2 - 3 Lakh",
    "Rs. 3 - 4 Lakh", "Rs. 4 - 5 Lakh", "Rs. 5 - 7.5 Lakh", "Rs. 7.5 - 10 Lakh",
    "Rs. 10 - 15 Lakh", "Rs. 15 - 20 Lakh", "Rs. 20 - 30 Lakh", "Rs. 30 - 50 Lakh",
    "Rs. 50 - 75 Lakh", "Rs. 75 - 1 Crore", "Rs. 1 Crore & Above"
];

export const residentialStatusOptions = ['Citizen', 'Permanent Resident', 'Work Permit', 'Student Visa', 'Temporary Visa', 'Other'];

export const dietOptions = ['Veg', 'Non-Veg', 'Eggetarian', 'Jain', 'Vegan'];

export const smokingOptions = ['No', 'Occasionally', 'Yes', 'Regularly'];

export const drinkingOptions = ['No', 'Occasionally', 'Yes', 'Regularly'];

export const familyTypeOptions = ['Joint Family', 'Nuclear Family', 'Others'];

export const familyStatusOptions = ["Rich/Affluent", "Upper Middle Class", "Middle Class"];

export const familyValuesOptions = ["Orthodox", "Traditional", "Moderate", "Liberal"];

export const fatherOccupationOptions = ['Business', 'Government Service', 'Private Service', 'Professional', 'Retired', 'Farmer', 'Not Employed', 'Passed Away'];

export const motherOccupationOptions = ['Homemaker', 'Business', 'Government Service', 'Private Service', 'Professional', 'Retired', 'Not Employed', 'Passed Away'];

export const siblingCounts = ['0', '1', '2', '3', '3+'];

export const familyIncomes = ["Below INR 1 Lakh", "INR 1 Lakh to 2 Lakh", "INR 2 Lakh to 4 Lakh", "INR 4 Lakh to 7 Lakh", "INR 7 Lakh to 10 Lakh", "INR 10 Lakh to 15 Lakh", "INR 15 Lakh to 20 Lakh", "INR 20 Lakh to 30 Lakh", "INR 30 Lakh to 50 Lakh", "INR 50 Lakh to 75 Lakh", "INR 75 Lakh to 1 Crore", "INR 1 Crore & above", "Not applicable"];

export const livingWithParentsOptions = ["Yes", "No", "Not Applicable"];

export const settleAbroadOptions = ["Yes", "No", "Undecided"];

export const getMarriedCounts = (countStr) => {
    if (!countStr || countStr === "0") return [];
    if (countStr === "1") return ["0", "1"];
    if (countStr === "2") return ["0", "1", "2"];
    if (countStr === "3") return ["0", "1", "2", "3"];
    if (countStr === "3+") return ["0", "1", "2", "3", "3+"];
    return [];
};
