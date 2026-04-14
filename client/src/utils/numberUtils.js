export const convertArabicNumbersToEnglish = (input = "") => {
    const ar = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
    const en = ["0","1","2","3","4","5","6","7","8","9"];

    let result = input;
    ar.forEach((n, i) => {
        result = result.replaceAll(n, en[i]);
    });

    return result;
};

