import React from "react";
import type { ClinicalQuestionnairesValue } from "../../types/intake";

interface ClinicalQuestionnairesProps {
  value: ClinicalQuestionnairesValue;
  onChange: (next: ClinicalQuestionnairesValue) => void;
}

export default function ClinicalQuestionnaires({ value, onChange }: ClinicalQuestionnairesProps) {
  const checkbox = (
    checked: boolean,
    onChecked: (checked: boolean) => void,
    label: string
  ) => (
    <label className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChecked(e.target.checked)}
        className="w-4 h-4 text-orange-600 border-black/20 rounded focus:ring-orange-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <>
      <section className="pt-6 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Symptoms Screening Questionnaire</h2>
        <h3 className="text-base font-medium text-slate-700 mb-2">Respiratory Panel Screening</h3>
        <p className="text-sm text-slate-600 mb-4">
          Used to identify candidates for Flu, COVID-19, RSV, and other respiratory pathogen testing.
        </p>
        <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {checkbox(value.respiratory.fever, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, fever: checked } }), "Fever (> 100.4°F/38°C) or chills")}
          {checkbox(value.respiratory.cough, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, cough: checked } }), "Cough (new or worsening)")}
          {checkbox(value.respiratory.shortnessOfBreath, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, shortnessOfBreath: checked } }), "Shortness of breath or difficulty breathing")}
          {checkbox(value.respiratory.congestion, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, congestion: checked } }), "Congestion or runny nose")}
          {checkbox(value.respiratory.fatigue, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, fatigue: checked } }), "Fatigue / muscle or body aches")}
          {checkbox(value.respiratory.lossOfTasteSmell, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, lossOfTasteSmell: checked } }), "New loss of taste or smell")}
        </div>
        <p className="text-sm font-medium text-slate-700 mt-4 mb-2">Risk factors & history</p>
        <div className="space-y-1">
          {checkbox(value.respiratory.closeContact, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, closeContact: checked } }), "Close contact with someone diagnosed with COVID-19, Flu, or RSV in the last 14 days?")}
          {checkbox(value.respiratory.compromisedImmune, (checked) => onChange({ ...value, respiratory: { ...value.respiratory, compromisedImmune: checked } }), "Do you have a compromised immune system?")}
        </div>
      </section>

      <section className="pt-6 border-t border-slate-200">
        <h3 className="text-base font-medium text-slate-700 mb-2">Urinary Tract Infection (UTI) Screening</h3>
        <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Urinalysis and Urine Culture/PCR.</p>
        <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
        <div className="space-y-1">
          {checkbox(value.uti.dysuria, (checked) => onChange({ ...value, uti: { ...value.uti, dysuria: checked } }), "Dysuria (burning or pain when urinating)")}
          {checkbox(value.uti.urgency, (checked) => onChange({ ...value, uti: { ...value.uti, urgency: checked } }), "Urinary urgency")}
          {checkbox(value.uti.pelvicPain, (checked) => onChange({ ...value, uti: { ...value.uti, pelvicPain: checked } }), "Pelvic pain (women) or rectal pain (men)")}
        </div>
        <p className="text-sm font-medium text-slate-700 mt-3 mb-2">Risk factors</p>
        {checkbox(value.uti.catheter, (checked) => onChange({ ...value, uti: { ...value.uti, catheter: checked } }), "Use of a urinary catheter?")}
      </section>

      <section className="pt-6 border-t border-slate-200">
        <h3 className="text-base font-medium text-slate-700 mb-2">Sexually Transmitted Infection (STI) Screening</h3>
        <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Chlamydia, Gonorrhea, Trichomonas, Mycoplasma, etc.</p>
        <p className="text-sm font-medium text-slate-700 mb-2">Current symptoms (check all that apply)</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {checkbox(value.sti.discharge, (checked) => onChange({ ...value, sti: { ...value.sti, discharge: checked } }), "Unusual discharge from penis, vagina, or anus")}
          {checkbox(value.sti.painUrination, (checked) => onChange({ ...value, sti: { ...value.sti, painUrination: checked } }), "Pain or burning during urination")}
          {checkbox(value.sti.painIntercourse, (checked) => onChange({ ...value, sti: { ...value.sti, painIntercourse: checked } }), "Pain during sexual intercourse")}
          {checkbox(value.sti.bumpsSores, (checked) => onChange({ ...value, sti: { ...value.sti, bumpsSores: checked } }), "Bumps, blisters, sores, or warts on or around genitals/mouth")}
          {checkbox(value.sti.itching, (checked) => onChange({ ...value, sti: { ...value.sti, itching: checked } }), "Itching or irritation in the genital area")}
          {checkbox(value.sti.lowerAbdominalPain, (checked) => onChange({ ...value, sti: { ...value.sti, lowerAbdominalPain: checked } }), "Lower abdominal pain")}
        </div>
        <p className="text-sm font-medium text-slate-700 mt-4 mb-2">Risk factors (lookback 6–12 months)</p>
        <div className="space-y-1">
          {checkbox(value.sti.newPartner, (checked) => onChange({ ...value, sti: { ...value.sti, newPartner: checked } }), "New sexual partner or multiple partners?")}
          {checkbox(value.sti.unprotected, (checked) => onChange({ ...value, sti: { ...value.sti, unprotected: checked } }), "Unprotected intercourse (vaginal, anal, or oral)?")}
          {checkbox(value.sti.pastSTI, (checked) => onChange({ ...value, sti: { ...value.sti, pastSTI: checked } }), "Past history of STIs?")}
          {checkbox(value.sti.partnerDiagnosed, (checked) => onChange({ ...value, sti: { ...value.sti, partnerDiagnosed: checked } }), "Partner recently diagnosed with an STI?")}
        </div>
      </section>

      <section className="pt-6 border-t border-slate-200">
        <h3 className="text-base font-medium text-slate-700 mb-2">Nail Fungus (Onychomycosis) Screening</h3>
        <p className="text-sm text-slate-600 mb-4">Used to identify candidates for Fungal Culture or PCR testing.</p>
        <p className="text-sm font-medium text-slate-700 mb-2">Visual assessment (check all that apply)</p>
        <div className="space-y-1">
          {checkbox(value.nailFungus.discoloration, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, discoloration: checked } }), "Discoloration: nails white, yellow, or brown")}
          {checkbox(value.nailFungus.brittleness, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, brittleness: checked } }), "Brittleness: nails crumbly, ragged, or brittle")}
          {checkbox(value.nailFungus.distortion, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, distortion: checked } }), "Distortion: nails misshapen or lifting from nail bed")}
          {checkbox(value.nailFungus.debris, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, debris: checked } }), "Debris under the nail")}
        </div>
        <p className="text-sm font-medium text-slate-700 mt-3 mb-2">History</p>
        <div className="space-y-1">
          {checkbox(value.nailFungus.athleteFoot, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, athleteFoot: checked } }), "History of Athlete's Foot (Tinea Pedis)?")}
          {checkbox(value.nailFungus.communalShower, (checked) => onChange({ ...value, nailFungus: { ...value.nailFungus, communalShower: checked } }), "Visited a communal shower/pool or nail salon recently?")}
        </div>
      </section>
    </>
  );
}
