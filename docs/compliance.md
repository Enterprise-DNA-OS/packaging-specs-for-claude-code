# Packaging evidence checks

Checked 22 October 2026. This is an internal evidence desk. It does not test material migration, certify food-contact safety, validate a label, calculate producer-responsibility fees, or file a return. The manufacturer and responsible reviewer retain those decisions.

| Rule | Source and jurisdiction | Implemented check | Limit |
|---|---|---|---|
| FOOD | [FSANZ packaging guidance](https://www.foodstandards.gov.au/consumer/chemicals/foodpackaging), Australia and New Zealand; [NSW packaging guidance](https://www.foodauthority.nsw.gov.au/help/food-packaging), Australia | Food-contact revisions require a current evidence reference, reviewer label and suitability note before approval. | The operator checks the actual supplier evidence against food type, temperature and contact conditions. A reference alone does not prove suitability. |
| RECYCLED | [NZ Commerce Commission environmental claims guidance](https://www.comcom.govt.nz/business/dealing-with-typical-situations/environmental-claims/), New Zealand; [ACCC environmental claims guidance](https://www.accc.gov.au/business/advertising-and-promotions/environmental-and-sustainability-claims), Australia | Positive recycled-content percentages require a current evidence reference and reviewer note. | The software does not verify the percentage, chain of custody, mass-balance allocation or advertising wording. |
| REVIEW | Local operating rule | The specification review date must be today or later before approval. | There is no universal statutory expiry or review interval here. The business chooses dates based on its evidence and risks. |
| DECISION | Local operating rule | The current revision needs approval by a label different from the editor. New revisions do not inherit approvals or evidence. | Labels are operator-entered, not verified identities or electronic signatures. |

FSANZ explains that food in contact with packaging must remain safe in both countries. Australia's Standard 3.2.2 includes intended-use and contamination requirements. Do not apply that Australian operational standard as a New Zealand checklist. The shared records support the business's own applicable food-safety system.

NZ and Australian environmental-claims guidance requires support for environmental representations. The percentage check is an evidence reminder, not a determination that a claim is accurate. A zero value remains a recorded assertion and still requires source review; it does not create an environmental claim in this application.

Evidence validity dates are supplied by the operator. Expired references remain in history and stop satisfying the current check. Multiple evidence records can support a revision; at least one current record of the relevant kind is required. There is no revocation workflow in this base: if evidence is withdrawn before its recorded date, enter a changes decision immediately, open an action and create a corrected revision. Review at the point of use.

A frozen release records a historical internal review only. Later evidence expiry does not rewrite that history. Re-run pack-check for a current decision. No command issues a declaration of conformity or authority to manufacture. The database owner can alter controls; application history is not a tamper-proof legal archive.
