import { describe, expect, it } from 'vitest';
import { parseCsvRecordLine, patientProfilesFromCsv, splitCsvLines } from './patientCsv';

describe('parseCsvRecordLine', () => {
  it('splits simple comma fields', () => {
    expect(parseCsvRecordLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });
  it('handles quoted commas', () => {
    expect(parseCsvRecordLine('"a,b",c')).toEqual(['a,b', 'c']);
  });
  it('escapes double quotes', () => {
    expect(parseCsvRecordLine('"say ""hi""",x')).toEqual(['say "hi"', 'x']);
  });
});

describe('patientProfilesFromCsv', () => {
  it('builds profiles from header and rows', () => {
    const csv = `Patient Name,DOB,Email
Ada Lovelace,1815-12-10,ada@example.com
`;
    const p = patientProfilesFromCsv(csv, 't.csv');
    expect(p.profiles).toHaveLength(1);
    expect(p.profiles[0]!.name).toBe('Ada Lovelace');
    expect(p.profiles[0]!.dob).toBe('1815-12-10');
    expect(p.profiles[0]!.email).toBe('ada@example.com');
    expect(p.source).toBe('t.csv');
  });
  it('skips empty name rows', () => {
    const csv = `Patient Name,DOB
Jane,2000-01-01
,2000-01-02
`;
    const p = patientProfilesFromCsv(csv);
    expect(p.profiles).toHaveLength(1);
  });
  it('throws without name column', () => {
    expect(() => patientProfilesFromCsv('DOB\n2000-01-01')).toThrow(/Patient Name/);
  });
});

describe('splitCsvLines', () => {
  it('strips BOM', () => {
    const lines = splitCsvLines('\uFEFFa,b\nc,d');
    expect(lines[0]).toBe('a,b');
  });
});
