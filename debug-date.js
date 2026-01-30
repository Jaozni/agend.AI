const dateString = "2026-02-01";

const parseLocalDate = (ds) => {
    const datePart = ds.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d;
};

const start = parseLocalDate(dateString);
console.log("Input String:", dateString);
console.log("Parsed Start Local:", start.toString());
console.log("Parsed Start ISO:", start.toISOString());
console.log("Timezone Offset:", start.getTimezoneOffset());

// Simulate Calendar Check for Jan 31
const jan31 = new Date(start);
jan31.setDate(jan31.getDate() - 1);
jan31.setHours(0, 0, 0, 0);

const startNormalized = new Date(start);
startNormalized.setHours(0, 0, 0, 0);

console.log("Jan 31 Normalized:", jan31.toString());
console.log("Start Normalized:", startNormalized.toString());

const diffTime = jan31.getTime() - startNormalized.getTime();
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
const rawDiffDays = diffTime / (1000 * 60 * 60 * 24);

console.log("Diff Time (ms):", diffTime);
console.log("Raw Diff Days:", rawDiffDays);
console.log("Math.floor Diff Days:", diffDays);

// Check Cycle logic
const cycle = 3; // 12x60
const mod = diffDays % cycle;
console.log("Cycle:", cycle);
console.log("DiffDays % Cycle:", mod);
console.log("Should show?", mod === 0 && diffDays >= 0);
