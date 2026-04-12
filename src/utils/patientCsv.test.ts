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

  it('parses EMR export CSV (FirstName, LastName, RecordId)', () => {
    const csv = `FirstName,MiddleName,LastName,RecordId,Gender,DateOfBirth(mm/dd/yyyy),Email ID,Home Phone,Mobile Phone,Address Line1,City,State,Zip Code,Date Of Joining
June,,Tcheng,DB0001,female,12/08/2004,hntcheng@yahoo.com,,,820 S Park Terr,CHICAGO,Illinois,60605,"Feb 24, 2025"
`;
    const p = patientProfilesFromCsv(csv, 'test-export.csv');
    expect(p.profiles).toHaveLength(1);
    expect(p.profiles[0]!.name).toBe('June Tcheng');
    expect(p.profiles[0]!.mrn).toBe('DB0001');
    expect(p.profiles[0]!.dob).toBe('2004-12-08');
    expect(p.profiles[0]!.email).toBe('hntcheng@yahoo.com');
    expect(p.profiles[0]!.id).toContain('test-export');
    expect(p.profiles[0]!.id).toContain('db0001');
  });
});

describe('splitCsvLines', () => {
  it('strips BOM', () => {
    const lines = splitCsvLines('\uFEFFa,b\nc,d');
    expect(lines[0]).toBe('a,b');
  });
});
