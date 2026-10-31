import {describe,it,expect} from 'vitest';
import {seriesDayAt} from '../src/series-calendar';
describe('Toronto series calendar',()=>{
 it('advances from Day 2 to Day 3 at Toronto midnight',()=>{
  expect(seriesDayAt(new Date('2026-10-30T03:59:59Z'))).toBe(2);
  expect(seriesDayAt(new Date('2026-10-30T04:00:00Z'))).toBe(3);
 });
 it('uses Toronto time for visitors in other time zones',()=>{
  expect(seriesDayAt(new Date('2026-10-30T09:29:59+05:30'))).toBe(2);
  expect(seriesDayAt(new Date('2026-10-30T09:30:00+05:30'))).toBe(3);
 });
 it('counts calendar dates across the daylight saving change',()=>{
  expect(seriesDayAt(new Date('2026-11-02T04:59:59Z'))).toBe(5);
  expect(seriesDayAt(new Date('2026-11-02T05:00:00Z'))).toBe(6);
 });
 it('stays within the 100-day series',()=>{
  expect(seriesDayAt(new Date('2026-10-01T12:00:00Z'))).toBe(1);
  expect(seriesDayAt(new Date('2027-12-01T12:00:00Z'))).toBe(100);
 });
});
