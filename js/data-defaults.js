// Auto-generated seed data for Gym App v1
// Generated from gym_project_detailed_export.txt (Feb 28, 2026)

export const DEFAULT_DATA = {
  "profile": {
    "name": "Adam",
    "createdAt": "2026-03-01T08:25:08.678605Z",
    "preferences": {
      "ttsEnabled": true,
      "restModeDefault": "normal",
      "finishedSetOffsetOptionsSec": [
        0,
        5,
        10,
        20,
        30,
        60
      ]
    }
  },
  "machines": {
    "chest_press": {
      "id": "chest_press",
      "name": "Chest Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat height: handles at mid-chest to nipple line when seated.\n\u2022 \ud83e\uddb6 Feet flat, slight leg drive for stability (not to move weight).\n\u2022 Back stays firmly against pad throughout.",
        "form": "**Execution**\n\u2022 \ud83c\udfaf Drive elbows slightly down and in \u2014 not flared straight out.\n\u2022 \ud83c\udf92 Shoulders stay down and back; avoid shrugging.\n\u2022 \ud83d\uded1 Stop short of locking elbows; keep tension on pecs and triceps.\n\n**Shoulder-safe posture**\n\u2022 \ud83e\uddf1 Keep chest lifted \u2014 don\u2019t let shoulders roll forward.\n\u2022 If you feel front/outer shoulder a lot \u2192 lower seat 1 notch or tuck elbows slightly.\n\n**Fix common issues**\n\u2022 Feeling triceps too much \u2192 focus on pec squeeze, elbows stay in.\n\u2022 One side weaker \u2192 match reps to the weaker side.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec lower, 1 sec press",
        "mantra": [
          "🧱 chest up",
          "💪 elbows 30–45°",
          "🚫 no lockout"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "incline_press": {
      "id": "incline_press",
      "name": "Incline Chest Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat slightly lower than you\u2019d expect \u2014 handles start at upper-chest level.\n\u2022 \ud83e\uddb6 Feet flat; back on pad.\n\u2022 \ud83c\udfaf Neutral wrists \u2014 don\u2019t let them bend back.",
        "form": "**Press path**\n\u2022 \u2197\ufe0f Press up and slightly back \u2014 don\u2019t over-arch to get range.\n\u2022 \ud83d\udccc Elbows stay a bit forward of your shoulders (scapular plane).\n\u2022 \ud83e\uddf1 Ribs down \u2014 this is incline, not a full overhead press.\n\n**If clavicle or front shoulder is irritated**\n\u2022 Decrease depth slightly.\n\u2022 Keep elbows a touch more tucked.\n\u2022 Use neutral handles if available.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec lower, 1 sec press",
        "mantra": [
          "📐 upper-chest path",
          "🧱 ribs quiet",
          "✋ wrists stacked"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "shoulder_press": {
      "id": "shoulder_press",
      "name": "Shoulder Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat height: handles start at chin/ear level, elbows under wrists.\n\u2022 \ud83e\uddb6 Feet planted; back against pad.\n\u2022 \ud83e\uddf1 Ribs down \u2014 this is a shoulder press, not an incline press.",
        "form": "**Execution**\n\u2022 \u2b06\ufe0f Press straight up without shrugging.\n\u2022 \ud83c\udf92 Shoulders stay heavy \u2014 don\u2019t let them rise throughout the set.\n\u2022 \ud83d\uded1 Stop just short of full lockout; keep shoulders loaded.\n\n**Common mistakes**\n\u2022 Flaring elbows too wide \u2192 neck/upper trap takeover.\n\u2022 Elbows drifting behind your body at the bottom \u2192 shoulder stress.\n\u2022 Over-arching lower back \u2192 turns it into an incline press.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec lower, 1 sec press",
        "mantra": [
          "🧱 ribs down",
          "🧘 no shrug",
          "🎯 elbows under wrists"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "pec_fly": {
      "id": "pec_fly",
      "name": "Pec Fly",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat height: handles at mid-chest level; arms roughly horizontal.\n\u2022 Adjust ROM so you feel a chest stretch \u2014 not a shoulder pinch.\n\u2022 \ud83e\udd1d Slight elbow bend stays fixed throughout.",
        "form": "**Execution**\n\u2022 Think \u201chug a big barrel\u201d \u2014 hands move inward; shoulders stay down.\n\u2022 \ud83c\udf92 Shoulders packed \u2014 no shrugging or rolling forward.\n\u2022 \ud83d\uded1 Stop before hands slam together; control the last inch.\n\n**Goal sensation**\n\u2022 Feel it in mid-chest (pecs), not front shoulders.\n\u2022 If front delts dominate \u2192 reduce stretch depth and lighten load.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2\u20133 sec open, 1 sec close + brief squeeze",
        "mantra": [
          "🤗 hug barrel",
          "🧘 shoulders down",
          "🐢 slow stretch"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "rear_delt": {
      "id": "rear_delt",
      "name": "Rear Delt (Reverse Fly)",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Chest firmly against pad; neck long.\n\u2022 Handle height at about shoulder height.\n\u2022 \ud83e\udd1d Use neutral/vertical handles if available (easiest on shoulders).",
        "form": "**Rep cues**\n\u2022 \ud83c\udfaf Lead with elbows: \u201celbows out and back\u201d \u2014 hands are just hooks.\n\u2022 \ud83c\udf92 Shoulders stay down/heavy \u2014 no shrug.\n\u2022 \ud83e\udde0 Think \u201copen the arms,\u201d not \u201cpinch shoulder blades hard.\u201d\n\n**Range + control**\n\u2022 Stop when upper arms are in line with torso (or slightly behind) without arching back.\n\u2022 Return slow until you feel the stretch; don\u2019t let shoulders roll forward aggressively.\n\n**Fixes if it feels wrong**\n\u2022 \ud83d\udd3a Trap/neck takeover \u2192 lower weight, slow down, keep shoulders \u201cheavy.\u201d\n\u2022 \ud83e\uddf1 Too much mid-back \u2192 reduce \u201csqueeze blades\u201d cue; focus on elbows moving.\n\u2022 \ud83c\udf00 Swinging \u2192 pause 1 sec at open position and lighten load.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec out, 3 sec back + optional 1 sec squeeze",
        "mantra": [
          "🧍 chest to pad",
          "🧘 neck long",
          "🎯 elbows lead"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "triceps_pushdown": {
      "id": "triceps_pushdown",
      "name": "Triceps Pushdown",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "attachment",
          "label": "Attachment",
          "type": "text"
        },
        {
          "key": "height",
          "label": "Pulley Height",
          "type": "text"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\uddbe Elbows pinned to sides; shoulders relaxed and down.\n\u2022 Stand close enough that the cable pulls slightly upward at the top.\n\u2022 \ud83e\udd1d Thumbless or neutral grip \u2014 don\u2019t white-knuckle.",
        "form": "**Execution**\n\u2022 \u2b07\ufe0f Extend down smoothly; stop just short of a hard lockout.\n\u2022 \u2b06\ufe0f Control the return \u2014 don\u2019t let elbows flare or drift forward.\n\u2022 Upper arms stay fixed throughout.\n\n**Fix common issues**\n\u2022 Forearms taking over \u2192 focus on keeping elbows fixed; wrists neutral.\n\u2022 Shoulders rising \u2192 consciously drop them before each rep.\n\u2022 Feeling it in chest \u2192 step back, keep elbows tight to sides.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec down, 2 sec up",
        "mantra": [
          "📌 elbows pinned",
          "✋ wrists neutral",
          "🐢 control up"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "triceps_extension_machine": {
      "id": "triceps_extension_machine",
      "name": "Triceps Extension (Machine)",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Align elbow joint with machine pivot.\n\u2022 Upper arms rest firmly on pad; don\u2019t let shoulders hike.\n\u2022 \ud83e\udd1d Light grip \u2014 wrists neutral.",
        "form": "**Execution**\n\u2022 \u2b07\ufe0f Smooth extension \u2014 don\u2019t slam lockout.\n\u2022 Keep upper arms still and pressed into pad.\n\u2022 \u2b06\ufe0f Control return; feel the stretch at the top.\n\n**Fix common issues**\n\u2022 Upper arms lifting off pad \u2192 reduce weight.\n\u2022 Shoulder involvement \u2192 press upper arms into pad; keep shoulders down.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec down, 2 sec up",
        "mantra": [
          "📌 upper arm still",
          "🐢 control",
          "🚫 no slam"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "lat_pulldown": {
      "id": "lat_pulldown",
      "name": "Lat Pulldown",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Thighs firmly under pads \u2014 adjust seat height.\n\u2022 Chest up slightly; neutral spine; slight lean back (~10\u201320\u00b0).\n\u2022 \ud83e\udd1d Hands are hooks \u2014 don\u2019t death-grip the bar.",
        "form": "**Execution cues to hit lats**\n\u2022 \ud83c\udfaf Think: \u201cDrive elbows DOWN toward your back pockets.\u201d\n\u2022 Initiate by depressing shoulder blades (down), then elbows down.\n\u2022 Pull bar to upper chest/clavicle area.\n\n**Elbow path (flared bar)**\n\u2022 Try a grip where elbows track 30\u201345\u00b0 in front of your torso (not straight out).\n\u2022 If elbows flare too wide, biceps dominate over lats.\n\u2022 Use straps if grip is the limiting factor.\n\n**Fix common issues**\n\u2022 Feeling arms only \u2192 lighten, use straps, focus on \u201celbow to pocket.\u201d\n\u2022 Shrugging at top \u2192 depress shoulder blades before initiating pull.\n\u2022 Leaning too far back \u2192 keep ~10\u201320\u00b0 lean, not a full row.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec return, 1\u20132 sec pull",
        "mantra": [
          "🪝 hands hooks",
          "⬇️ elbows to pockets",
          "🧘 shoulders down"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_row": {
      "id": "seated_row",
      "name": "Seated Row",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\uddcd\u200d\u2642\ufe0f Chest tall; don\u2019t round into the pull.\n\u2022 \ud83e\uddb6 Feet stable \u2014 avoid rocking or swinging.\n\u2022 \ud83e\udd1d Light grip \u2014 focus on elbows, not hands.",
        "form": "**Execution**\n\u2022 \ud83c\udfaf Pull toward lower ribs/upper abdomen.\n\u2022 Think \u201celbows back, squeeze mid-back,\u201d then control the forward stretch.\n\u2022 Allow a slight torso lean forward on the stretch \u2014 not rounding.\n\n**Fix common issues**\n\u2022 Biceps dominating \u2192 thumbless grip; drive elbows, not hands.\n\u2022 Low back rounding \u2192 reduce weight; brace core; keep chest tall.\n\u2022 Swinging \u2192 control the eccentric; slow it down.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 2 sec pull, 3 sec return",
        "mantra": [
          "🧱 tall chest",
          "↩️ elbows back",
          "🧊 pause squeeze"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "biceps_curl_machine": {
      "id": "biceps_curl_machine",
      "name": "Biceps Curl (Machine)",
      "category": "pull",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat so elbows align with pivot \u2014 this is critical.\n\u2022 Upper arms pressed against pad; shoulders relaxed and down.\n\u2022 \ud83e\udd1d Light grip \u2014 don\u2019t white-knuckle.",
        "form": "**Execution**\n\u2022 \u2b06\ufe0f Curl smoothly; squeeze at the top briefly.\n\u2022 \ud83c\udf92 Don\u2019t lift shoulders \u2014 keep them down throughout.\n\u2022 \u2b07\ufe0f Control the descent; don\u2019t bounce off the bottom.\n\n**Fix common issues**\n\u2022 Shoulders rising \u2192 consciously drop them; reduce weight.\n\u2022 Bouncing at bottom \u2192 slow the eccentric; pause briefly.\n\u2022 Forearm fatigue before biceps \u2192 loosen grip.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec up, 2\u20133 sec down",
        "mantra": [
          "📌 upper arm fixed",
          "✋ wrists neutral",
          "🐢 slow down"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "assisted_chin": {
      "id": "assisted_chin",
      "name": "Assisted Chin/Pull-up",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 6,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \u2696\ufe0f Assistance weight: enough to get 6\u201312 clean reps.\n\u2022 Full hang only if shoulders tolerate it; partial hang is fine.\n\u2022 Grip: shoulder-width or slightly wider; pronated or neutral.",
        "form": "**Execution**\n\u2022 \ud83c\udfaf Pull chest toward bar \u2014 don\u2019t just chin over.\n\u2022 \ud83c\udf92 Initiate with shoulder blades depressed (down), then elbows down.\n\u2022 Avoid craning or jutting your neck upward.\n\n**Fix common issues**\n\u2022 Arms doing all the work \u2192 initiate with \u201cshoulders down\u201d before pulling.\n\u2022 Neck craning \u2192 keep chin slightly tucked; eyes forward.\n\u2022 Short range \u2192 aim for full elbow extension at the bottom.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1\u20132 sec up, 2\u20133 sec down",
        "mantra": [
          "🧘 shoulders down",
          "⬆️ chest to bar",
          "🪝 hands hooks"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_leg_press": {
      "id": "seated_leg_press",
      "name": "Seated Leg Press",
      "category": "legs",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 15
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Seat back: slightly more reclined reduces knee shear and helps glutes.\n\u2022 \ud83e\uddb6 Foot placement: shoulder-width, toes slightly out.\n\u2022 Higher on platform = more glute/ham; lower = more quad + more knee.\n\u2022 \ud83d\uded1 Don\u2019t lock out at the top \u2014 stop just before the \u201cjoint hang.\u201d",
        "form": "**Execution**\n\u2022 \u2b07\ufe0f Descend under control; don\u2019t bottom out (no butt lifting off seat).\n\u2022 Keep knees tracking over toes \u2014 no cave-in.\n\u2022 \ud83d\uded1 Stop just before \u201cjoint hang\u201d at top; don\u2019t lock out hard.\n\n**Knee-friendly adjustments**\n\u2022 Feeling more knees than thighs \u2192 feet higher + recline seat more.\n\u2022 Knees caving \u2192 push knees out to follow toes throughout.\n\u2022 Only increase load when knee-friendly ROM is consistent.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 3 sec down, 1\u20132 sec up",
        "mantra": [
          "🦶 feet higher = knee friendly",
          "🧭 knees over toes",
          "🚫 no lockout"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_leg_curl": {
      "id": "seated_leg_curl",
      "name": "Seated Leg Curl",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Knee joint aligned with pivot \u2014 adjust seat forward/back.\n\u2022 Pad rests just above ankles (not on calves).\n\u2022 \ud83e\uddcd\u200d\u2642\ufe0f Sit tall; avoid arching or rocking.",
        "form": "**Execution**\n\u2022 \u2b07\ufe0f Curl smoothly \u2014 pause briefly at the contracted position.\n\u2022 \ud83c\udf92 Keep hips pressed into seat; don\u2019t rock.\n\u2022 \u2b06\ufe0f Control back up slowly.\n\n**Goal sensation**\n\u2022 Feel it in the hamstrings \u2014 not the low back or calves.\n\u2022 If you feel low back \u2192 brace core, sit taller, reduce weight.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec curl, 1 sec hold, 3 sec return",
        "mantra": [
          "🦵 squeeze ham",
          "🧊 pause",
          "🐢 control up"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "leg_extension": {
      "id": "leg_extension",
      "name": "Leg Extension",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Knee aligns with pivot \u2014 adjust seat back.\n\u2022 Pad rests just above ankle (not on foot).\n\u2022 \u26a0\ufe0f Use with care \u2014 stop if you feel knee pain.",
        "form": "**Execution**\n\u2022 \u2b06\ufe0f Smooth extension \u2014 do not slam lockout.\n\u2022 \ud83e\uddb5 Squeeze quad at the top briefly.\n\u2022 \u2b07\ufe0f Control the eccentric \u2014 don\u2019t let weight crash down.\n\n**Knee care**\n\u2022 Stop immediately if you feel sharp knee pain.\n\u2022 Lighter weight with more reps is often safer (12\u201320 vs heavy 8\u201310).\n\u2022 Avoid if you have an acute knee issue.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec up, 2\u20133 sec down",
        "mantra": [
          "🐢 slow down",
          "🚫 no slam",
          "🧭 knee comfy"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "hip_abduction": {
      "id": "hip_abduction",
      "name": "Hip Abduction",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Sit tall; pelvis neutral (don\u2019t tilt forward or back).\n\u2022 Pad sits just above the knee on outer thigh.\n\u2022 \ud83e\uddb5 Feet flat; ankles relaxed.",
        "form": "**Execution**\n\u2022 \ud83e\uddb5 Drive knees outward \u2014 don\u2019t rock torso to the side.\n\u2022 Pause briefly at end range; feel outer glute/hip.\n\u2022 \u2b05\ufe0f Slow, controlled return.\n\n**Goal sensation**\n\u2022 Outer glutes and hip abductors \u2014 not low back.\n\u2022 If you feel back \u2192 sit taller; reduce ROM slightly; lighten.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec out, 1 sec hold, 2 sec in",
        "mantra": [
          "🧍 tall torso",
          "🚫 no rocking",
          "🧊 pause end range"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "hip_adduction": {
      "id": "hip_adduction",
      "name": "Hip Adduction",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Setup**\n\u2022 \ud83e\ude91 Sit tall; pelvis neutral.\n\u2022 Pad sits just above knee on inner thigh.\n\u2022 \ud83e\uddb5 Feet flat; ankles relaxed.",
        "form": "**Execution**\n\u2022 \ud83e\uddb5 Squeeze knees inward smoothly \u2014 don\u2019t rock torso.\n\u2022 Pause briefly at closed position; feel inner thigh.\n\u2022 \u27a1\ufe0f Slow, controlled return to start.\n\n**Goal sensation**\n\u2022 Inner thighs (adductors) \u2014 not hip flexors or low back.\n\u2022 If you feel hip flexors \u2192 sit taller; reduce ROM.\n\n**Tempo**\n\u2022 \u23f1\ufe0f 1 sec in, 1 sec hold, 2 sec out",
        "mantra": [
          "🧍 tall torso",
          "🚫 no rocking",
          "🧊 pause end range"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "bike": {
      "id": "bike",
      "name": "Bike",
      "category": "cardio",
      "type": "conditioning",
      "variants": [
        "LifeFitness"
      ],
      "repRange": {
        "min": 0,
        "max": 0
      },
      "rirPattern": [
        0
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "handlebar",
          "label": "Handlebar",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "**Seat height**\n\u2022 Slight bend in knee at bottom of pedal stroke (not locked, not cramped).\n\u2022 Too low = knee pain; too high = hip rocking.\n\n**Handlebar**\n\u2022 Upright = more comfortable, less back stress.\n\u2022 Lower = more aerodynamic, more core engagement.\n\n**Foot position**\n\u2022 Ball of foot over pedal axle.\n\u2022 Heel slightly dropped or level \u2014 don\u2019t point toes down.\n\n**Resistance**\n\u2022 Start easy to warm up legs before adding load.",
        "form": "**Cycling RPE Scale**\n\u2022 RPE 1\u20132 \u00b7 Super easy: Warm-up/recovery spin. No effort.\n\u2022 RPE 3\u20134 \u00b7 Easy (Zone 2): Full sentences. Good pre- or post-lift.\n\u2022 RPE 5\u20136 \u00b7 Comfortably hard: Short phrases. Steady cardio work.\n\u2022 RPE 7 \u00b7 Hard: Talking is broken. Legs burning.\n\u2022 RPE 8 \u00b7 Very hard: A few words only. Near-max sustainable.\n\u2022 RPE 9\u201310 \u00b7 All-out: Sprint/interval territory.\n\n**Cardio + Lifting Guidelines**\n\u2022 Before heavy compound lifts: \u2264 RPE 4 and short (5\u201310 min).\n\u2022 Heavy leg day \u2192 RPE 2\u20134 only.\n\u2022 After lifting: 10\u201325 min at RPE 3\u20135.\n\u2022 Intervals (RPE 7\u20139): best on separate days or after lifting.",
        "mantra": [
          "🚴 steady or ⚡ intervals",
          "📈 RPE / max HR",
          "💬 can you talk? → RPE 3–4",
          "🔥 legs burning → RPE 7+"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "ab_crunch_machine": {
      "id": "ab_crunch_machine",
      "name": "Ab Crunch Machine",
      "category": "core",
      "type": "isolation",
      "variants": ["Selectorized"],
      "repRange": { "min": 10, "max": 15 },
      "rirPattern": [2, 1, 1],
      "setupFields": [
        { "key": "seat", "label": "Seat", "type": "number" },
        { "key": "weight", "label": "Weight", "type": "number" }
      ],
      "tips": {
        "setup": "**Seat**: Adjust so the pad sits mid-chest. Feet flat on the floor or on the foot bar.",
        "form": "**Execution**\n• Exhale and crunch forward — round the spine, don't just hinge at the hips.\n• Pause at peak contraction for 1 second.\n• Slow eccentric — 2-3 seconds back up.\n• Keep neck neutral — don't pull with your head.\n• Focus on ribs moving toward hips, not arms pulling.",
        "mantra": ["💨 exhale", "🧊 pause", "🚫 no hip hinge"],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "rotary_torso": {
      "id": "rotary_torso",
      "name": "Rotary Torso",
      "category": "core",
      "type": "isolation",
      "variants": ["Selectorized"],
      "repRange": { "min": 12, "max": 15 },
      "rirPattern": [2, 1, 1],
      "setupFields": [
        { "key": "seat", "label": "Seat", "type": "number" },
        { "key": "range", "label": "Range", "type": "number" }
      ],
      "tips": {
        "setup": "**Seat**: Adjust so the pads are snug against your chest. Set range of motion to a comfortable rotation.\n\n**Note**: Do one set each direction — log each direction as a separate set.",
        "form": "**Execution**\n• Rotate from the core — don't push with your arms.\n• Controlled tempo throughout — no momentum or jerking.\n• Pause at end range for 1 second.\n• Return slowly — the eccentric matters.\n• Keep hips and legs still — only your torso moves.",
        "mantra": ["🔄 core rotates", "🧊 pause", "🦵 hips still"],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "cable_crunch": {
      "id": "cable_crunch",
      "name": "Cable Crunch",
      "category": "core",
      "type": "isolation",
      "variants": ["Cable"],
      "repRange": { "min": 12, "max": 20 },
      "rirPattern": [2, 1, 1],
      "setupFields": [
        { "key": "attachment", "label": "Attachment", "type": "text" },
        { "key": "pulley", "label": "Pulley Height", "type": "text" }
      ],
      "tips": {
        "setup": "**Attachment**: Rope attachment on high pulley. Kneel facing the machine, rope behind your head.",
        "form": "**Execution**\n• Crunch down by rounding the spine — ribs toward hips.\n• Keep hips stationary — don't sit back.\n• Exhale hard at the bottom.\n• Slow eccentric — let the weight stretch you back up.\n• Arms stay fixed — the movement comes from your abs.",
        "mantra": ["💨 exhale", "🧊 pause", "🦵 hips fixed"],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "hanging_leg_raise": {
      "id": "hanging_leg_raise",
      "name": "Hanging Leg Raise",
      "category": "core",
      "type": "isolation",
      "variants": [],
      "repRange": { "min": 8, "max": 15 },
      "rirPattern": [2, 1, 1],
      "setupFields": [
        { "key": "notes", "label": "Notes", "type": "text" }
      ],
      "tips": {
        "setup": "**Setup**: Hang from a pull-up bar or use captain's chair / arm slings. Bodyweight exercise — log weight as 0 or add weight if using a dumbbell between feet.",
        "form": "**Execution**\n• Raise legs by curling the pelvis up — don't just lift legs with hip flexors.\n• Control the descent — no swinging.\n• Bent knees = easier; straight legs = harder.\n• Exhale as you raise, inhale as you lower.\n• Minimize body swing — brace your core throughout.",
        "mantra": ["💨 exhale", "🚫 no swing", "🦴 curl pelvis"],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    }
  },
  "templates": {
    "push_default": {
      "id": "push_default",
      "name": "Push (Default)",
      "dayType": "push",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "chest_press"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "incline_press",
            "shoulder_press"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "pec_fly",
            "rear_delt",
            "triceps_pushdown",
            "triceps_extension_machine"
          ]
        },
        {
          "id": "abs",
          "name": "Other",
          "suggestions": [
            "ab_crunch_machine",
            "rotary_torso"
          ]
        }
      ]
    },
    "pull_default": {
      "id": "pull_default",
      "name": "Pull (Default)",
      "dayType": "pull",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "lat_pulldown",
            "assisted_chin"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "seated_row"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "rear_delt",
            "biceps_curl_machine"
          ]
        },
        {
          "id": "abs",
          "name": "Other",
          "suggestions": [
            "ab_crunch_machine",
            "rotary_torso"
          ]
        }
      ]
    },
    "legs_default": {
      "id": "legs_default",
      "name": "Legs (Default)",
      "dayType": "legs",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "seated_leg_press"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "seated_leg_curl"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "hip_abduction",
            "hip_adduction",
            "leg_extension"
          ]
        },
        {
          "id": "abs",
          "name": "Other",
          "suggestions": [
            "ab_crunch_machine",
            "rotary_torso"
          ]
        }
      ]
    },
    "bonus_default": {
      "id": "bonus_default",
      "name": "Bonus (Full Body Lite)",
      "dayType": "bonus",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "fullbody",
          "name": "Full Body",
          "suggestions": [
            "seated_leg_press",
            "chest_press",
            "lat_pulldown",
            "seated_row"
          ]
        },
        {
          "id": "abs",
          "name": "Other",
          "suggestions": [
            "ab_crunch_machine",
            "rotary_torso"
          ]
        }
      ]
    }
  },
  "sessions": []
};
