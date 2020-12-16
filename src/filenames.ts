import { SnapshotState } from "./jest";
import { JestScreenshotConfiguration } from "./config";
import * as path from "path";
import { createHash } from "crypto";
import kebabCase = require("lodash.kebabcase");// tslint:disable-line

const FILENAME_SUFFIX = ".snap.png";
const FILENAME_CHECKSUM_LENGTH = 5;
const MAX_TEST_FILENAME_LENGTH = 75;
// Windows allows a maximum of 255 characters. The suffix length as well as the length of two `-` and
// the length of the md5-hash need to be subtracted.
const MAX_FILENAME_LENGTH = 255 - FILENAME_SUFFIX.length - FILENAME_CHECKSUM_LENGTH - 3;

/**
 * Calculates the filename for an individual image snapshot file.
 * Depending on the configuration the provided `identifier` generator will be used
 * or a default identifier will be generated.
 *
 * @param testPath The `testPath` from the jest test configuration, leading to the test file.
 * @param currentTestName The `currentTestName` from the jest test configuration,
 *     the name of the current `it`/`describe` test.
 * @param snapshotState The `snapshotState` from the jest test configuration.
 *
 * @param fileNamePatternFn an optional fileNamePatter function
 * @return A string used as a filename for the current snapshot.
 */
export function getSnapshotFileName(
    testPath: string,
    currentTestName: string,
    snapshotState: SnapshotState,
    fileNamePatternFn?: JestScreenshotConfiguration["fileNamePatternFn"],
) {
    // Counter for the n-th snapshot in the test.
    const counter = snapshotState._counters.get(currentTestName);
    // Generate the test filename and identifier path for the maximum windows filename length.
    const testFileNamePart = kebabCase(path.basename(testPath));
    const identifierPart = kebabCase(currentTestName);
    if (fileNamePatternFn) {
        return fileNamePatternFn(testFileNamePart, identifierPart, counter);
    }
    const limitedFileNamePart = testFileNamePart.substr(0, MAX_TEST_FILENAME_LENGTH);
    const limitedIdentifierPart = identifierPart.substr(
        0,
        MAX_FILENAME_LENGTH - limitedFileNamePart.length - String(counter).length,
    );
    const fileNameStart = `${limitedFileNamePart}-${limitedIdentifierPart}-${counter}`;
    // MD5 Hash generator.
    const md5 = createHash("md5");
    const checksum = md5.update(fileNameStart).digest("hex").substr(0, FILENAME_CHECKSUM_LENGTH);
    return `${fileNameStart}-${checksum}${FILENAME_SUFFIX}`;
}

/**
 * Calculates the absolute path to an individual image snapshot file.
 *
 * @param testPath The `testPath` from the jest test configuration, leading to the test file.
 * @param currentTestName The `currentTestName` from the jest test configuration,
 *     the name of the current `it`/`describe` test.
 * @param snapshotState The `snapshotState` from the jest test configuration.
 *
 * @param snapshotsDir
 * @param fileNamePatternFn
 * @return A string with the absolute path to the current snapshot.
 */
export function getSnapshotPath(
    testPath: string,
    currentTestName: string,
    snapshotState: SnapshotState,
    snapshotsDir?: string,
    fileNamePatternFn?: JestScreenshotConfiguration["fileNamePatternFn"],
) {
    const fileName = getSnapshotFileName(testPath, currentTestName, snapshotState, fileNamePatternFn);
    return path.join(path.dirname(testPath), snapshotsDir || "__snapshots__", fileName);
}

export function getReportDir(reportDir?: string) {
    return path.join(
        process.cwd(),
        reportDir || "jest-screenshot-report",
    );
}

export function getReportPath(
    testPath: string,
    currentTestName: string,
    snapshotState: SnapshotState,
    reportDir?: string,
    fileNamePatternFn?: JestScreenshotConfiguration["fileNamePatternFn"],
) {
    const counter = snapshotState._counters.get(currentTestName);
    return path.join(
        getReportDir(reportDir),
        "reports",
        getSnapshotFileName(testPath, currentTestName, snapshotState, fileNamePatternFn),
    );
}
