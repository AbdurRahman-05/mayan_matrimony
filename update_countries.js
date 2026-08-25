const fs = require('fs');
let code = fs.readFileSync('frontend/src/data/locationData.js', 'utf8');

// Replace USA, UK, UAE with full names so we keep their states
code = code.replace(/"USA":/g, '"United States":');
code = code.replace(/"UK":/g, '"United Kingdom":');
code = code.replace(/"UAE":/g, '"United Arab Emirates":');

const newCountries = [
    'India', 'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Singapore', 'Malaysia', 'Sri Lanka', 'Nepal', 'Bhutan', 'Bangladesh', 'Pakistan', 'Maldives', 'Afghanistan', 'Indonesia', 'Thailand', 'Philippines', 'Vietnam', 'Myanmar', 'China', 'Japan', 'South Korea', 'Hong Kong', 'Taiwan', 'Germany', 'France', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Iceland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Russia', 'Ukraine', 'Greece', 'Turkey', 'Israel', 'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Ghana', 'Tanzania', 'Mauritius', 'Seychelles', 'Uganda', 'Ethiopia', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia', 'Guyana', 'Suriname', 'Jamaica', 'Trinidad and Tobago', 'Bahamas', 'Barbados', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Other'
];

let match = code.match(/export const countryStateCityMap = \{([\s\S]*?)\};(?:[\r\n]+)(?=export)/);
if (match) {
    let theObjCode = '({' + match[1] + '})';
    let theObj = eval(theObjCode);

    // Sort to keep order but they will be object keys. The new countries not existing will be added at the end.
    newCountries.forEach(c => {
        if (!theObj[c]) {
            theObj[c] = {};
        }
    });

    let newMapCode = 'export const countryStateCityMap = ' + JSON.stringify(theObj, null, 4) + ';\n';
    code = code.replace(/export const countryStateCityMap = \{[\s\S]*?\};(?:[\r\n]+)(?=export)/, newMapCode + '\n');

    fs.writeFileSync('frontend/src/data/locationData.js', code);
    console.log('Successfully updated countries');
} else {
    console.log('Failed to match');
}
