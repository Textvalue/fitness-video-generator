import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const prompts: Record<string, string> = {
  // === CARRY ===
  "Plank":
    "Person in a forearm plank position: body forms a perfectly straight line from head to heels. Forearms flat on the ground shoulder-width apart, elbows directly under shoulders. Core tightly braced, glutes squeezed, legs straight with toes on the ground. Gaze down at the floor between the hands. No sagging hips or raised buttocks.",

  "Farmer Carry":
    "Person standing tall holding a heavy dumbbell or kettlebell in each hand at their sides. Arms straight, shoulders pulled back and down, chest up, core braced. Walking forward with short controlled steps. Upright posture, no leaning to either side. Weights hang at hip level.",

  "Sled Push":
    "Person pushing a weighted sled with both hands gripping the vertical handles. Body at a 45-degree forward lean, arms extended and locked. Driving forward with powerful leg strides, one foot pushing off the ground. Back flat, core engaged, head in neutral alignment with the spine.",

  // === GAIT ===
  "Burpee":
    "Person performing a burpee in the explosive jump phase: arms reaching overhead, body fully extended in the air, feet just leaving the ground. Alternatively show the push-up position phase: chest near the floor, body straight, hands shoulder-width apart. Athletic, explosive movement.",

  "Box Jump":
    "Person in mid-air jumping onto a plyometric box. Knees driving up toward chest, arms swinging forward for momentum. Eyes focused on the landing spot on top of the box. Athletic crouch position just before takeoff, or landing softly on top of the box with knees slightly bent.",

  "Elliptical":
    "Person standing on an elliptical machine, hands gripping the moving handles. One leg forward, one leg back in a smooth striding motion. Upright posture, core engaged, looking straight ahead. Smooth, fluid movement.",

  "Stationary Bike":
    "Person seated on a stationary bike, feet clipped into pedals, hands on handlebars. Slight forward lean from the hips, back straight, core engaged. One leg extending downward on the pedal stroke. Focused expression, athletic posture.",

  "Jump Rope":
    "Person jumping rope: both feet slightly off the ground, knees slightly bent, on the balls of the feet. Arms at sides with elbows close to the body, wrists rotating the rope. Rope visible arcing overhead. Light, athletic bounce, upright posture.",

  "Treadmill":
    "Person running on a treadmill with proper running form: upright posture, arms bent at 90 degrees swinging naturally, one foot striking the belt while the other lifts behind. Looking straight ahead, relaxed shoulders, core engaged.",

  "Run":
    "Person running outdoors with proper form: upright torso, slight forward lean, arms bent at 90 degrees pumping naturally. Mid-foot strike, one leg driving forward while the other pushes off behind. Relaxed shoulders, focused gaze ahead.",

  "Sprint":
    "Person sprinting at maximum effort: aggressive forward lean, powerful arm drive with hands cutting past hips, one knee driving high while the opposite leg pushes off forcefully. Intense facial expression, explosive body position, on the balls of the feet.",

  // === HINGE ===
  "Leg Curl":
    "Person lying face down on a leg curl machine. Ankles hooked under the padded roller. Curling the heels toward the buttocks by bending at the knees. Hips pressed flat against the pad, hands gripping the handles. Controlled movement, hamstrings visibly engaged.",

  "Romanian Deadlift":
    "Person standing holding a barbell at hip height with an overhand grip, arms straight. Hinging forward at the hips with a slight knee bend, pushing the hips back. Bar sliding down the thighs toward the shins. Back perfectly flat, chest up, shoulder blades retracted. Hamstrings stretched.",

  "Hip Thrust":
    "Person with upper back resting on a bench, feet flat on the floor hip-width apart. Barbell across the hips. Driving hips upward until the body forms a straight line from shoulders to knees. Chin slightly tucked, squeezing glutes hard at the top. Shins vertical at the top position.",

  "Kettlebell Swing":
    "Person at the top of a kettlebell swing: standing tall with hips fully extended, arms straight out in front at shoulder height, kettlebell at the apex. Or at the bottom: hinged at the hips, kettlebell swinging between the legs, back flat, knees slightly bent. Explosive hip drive.",

  "Deadlift":
    "Person lifting a barbell from the floor: feet hip-width apart, hands gripping the bar just outside the knees. Back flat, chest up, hips hinged back. Bar close to the shins, arms straight. Driving up by extending hips and knees simultaneously. Strong, athletic posture.",

  // === PULL ===
  "Seated Row":
    "Person seated at a cable row machine, feet on the foot platform, knees slightly bent. Pulling the handle toward the lower chest/upper abdomen. Chest up, back straight, shoulder blades squeezing together. Elbows driving straight back past the torso.",

  "Swimming":
    "Person swimming freestyle in a pool: one arm extended forward entering the water, the other arm pulling through underwater. Body streamlined and horizontal, face turned to the side for a breath. Kick visible at the surface.",

  "Bicep Curl":
    "Person standing upright holding dumbbells at their sides with palms facing forward. Curling one or both dumbbells up toward the shoulders by bending at the elbows. Upper arms stationary at the sides, elbows pinned. Controlled movement, forearms rotating slightly.",

  "Chin Up":
    "Person hanging from a pull-up bar with palms facing toward them (supinated grip), hands shoulder-width apart. Pulling the body up until the chin clears the bar. Elbows driving down, chest lifting toward the bar. Core tight, legs straight or slightly crossed.",

  "Pull Up":
    "Person hanging from a pull-up bar with an overhand grip (palms facing away), hands slightly wider than shoulder-width. Pulling the body up until the chin is above the bar. Lats flared, shoulder blades pulling down and together. Full arm extension at the bottom.",

  "Dumbbell Row":
    "Person with one knee and one hand on a bench for support, opposite foot on the floor. Pulling a dumbbell up toward the hip with the free hand. Elbow driving past the torso, shoulder blade squeezing toward the spine. Back flat and parallel to the floor, core braced.",

  "Lat Pulldown":
    "Person seated at a lat pulldown machine, thighs secured under the pads. Gripping the wide bar with an overhand grip. Pulling the bar down to the upper chest, elbows driving down and slightly back. Chest lifted, slight lean back, squeezing the lats at the bottom.",

  "Inverted Row":
    "Person hanging underneath a bar set at waist height, body straight and rigid like a reverse plank. Heels on the floor, arms fully extended. Pulling the chest up to the bar by squeezing the shoulder blades together. Body stays in a straight line throughout.",

  "Barbell Row":
    "Person bent over at approximately 45 degrees, holding a barbell with an overhand grip. Pulling the bar toward the lower chest/upper abdomen. Back flat, knees slightly bent, core braced. Shoulder blades retracting at the top, elbows driving past the torso.",

  "Rowing Machine":
    "Person on a rowing machine in the drive phase: legs pushing against the foot plates, arms pulling the handle toward the lower chest, leaning back slightly. Or in the catch position: knees bent, arms extended, leaning forward from the hips. Fluid, powerful motion.",

  // === PUSH ===
  "Dip":
    "Person on parallel dip bars, arms straight supporting the body at the top. Or lowered position: elbows bent to roughly 90 degrees, slight forward lean of the torso. Legs straight or crossed behind. Shoulders down and back, chest open, controlled descent.",

  "Overhead Press":
    "Person standing with a barbell at shoulder height, grip slightly wider than shoulder-width. Pressing the bar straight overhead until arms are fully locked out. Core braced, ribcage down, glutes squeezed. Bar directly over the midfoot at the top, head pushed slightly forward through the arms.",

  "Lateral Raise":
    "Person standing upright holding light dumbbells at their sides. Raising both arms out to the sides until they reach shoulder height, forming a T-shape. Slight bend in the elbows, palms facing down at the top. Controlled movement, no swinging or momentum.",

  "Dumbbell Bench Press":
    "Person lying flat on a bench, feet on the floor. Holding a dumbbell in each hand at chest level, elbows at roughly 45 degrees from the body. Pressing the dumbbells up until arms are extended, weights coming together at the top. Shoulder blades squeezed together against the bench.",

  "Push Up":
    "Person in a push-up position: hands slightly wider than shoulder-width, body in a straight line from head to heels. Lowering the chest toward the floor by bending the elbows, or pushing up with arms fully extended. Core tight, no sagging hips, elbows at roughly 45 degrees.",

  "Bench Press":
    "Person lying on a flat bench, feet flat on the floor. Gripping a barbell slightly wider than shoulder-width. Lowering the bar to the mid-chest with elbows at roughly 45 degrees, or pressing it up with arms extended. Shoulder blades pinched together, slight arch in the upper back, firm grip.",

  "Tricep Pushdown":
    "Person standing at a cable machine, gripping a straight bar or rope attachment at chest height. Pushing the weight down by extending the elbows until arms are straight. Upper arms pinned to the sides, only the forearms move. Slight forward lean, core engaged.",

  "Tricep Extension":
    "Person holding a dumbbell overhead with both hands, arms extended. Lowering the weight behind the head by bending at the elbows, keeping upper arms vertical and close to the ears. Then extending back to the top. Controlled movement, core braced, standing tall.",

  "Incline Bench Press":
    "Person lying on an incline bench set to roughly 30-45 degrees. Gripping a barbell slightly wider than shoulder-width. Pressing the bar from upper chest level to full arm extension above the upper chest. Feet flat on the floor, shoulder blades retracted, controlled path.",

  "Calf Raise":
    "Person standing on the edge of a step or flat on the floor, rising up onto the balls of the feet as high as possible. Legs straight, body upright, core engaged. Full ankle extension at the top, controlled lowering. Can hold dumbbells at sides for added resistance.",

  // === ROTATION / CORE ===
  "Crunch":
    "Person lying on their back with knees bent and feet flat on the floor. Hands behind the head or across the chest. Curling the upper body forward, lifting the shoulder blades off the ground. Lower back stays on the floor. Controlled movement, exhaling on the way up.",

  "Sit Up":
    "Person lying flat on their back with knees bent and feet anchored or flat on the floor. Rising all the way up to a seated position with an upright torso. Hands behind the head or crossed on the chest. Controlled ascent and descent, core engaged throughout.",

  "Leg Raise":
    "Person lying flat on their back with legs straight and together. Raising both legs up toward the ceiling until they are perpendicular to the floor, then lowering them slowly without touching the ground. Hands at sides or under the hips for support. Lower back pressed into the floor.",

  "Side Plank":
    "Person balanced on one forearm and the side of one foot, body forming a straight line from head to feet. Top arm either on the hip or extended toward the ceiling. Hips lifted, not sagging. Core and obliques engaged. Stacked feet or staggered for stability.",

  // === SQUAT ===
  "Front Squat":
    "Person with a barbell resting on the front shoulders in a front rack position, elbows high and pointing forward. Squatting down with knees tracking over toes, torso upright, hips dropping below parallel. Feet shoulder-width apart, heels on the ground. Chest stays lifted.",

  "Leg Extension":
    "Person seated on a leg extension machine, back against the pad, ankles hooked behind the lower roller. Extending the legs forward until fully straight, squeezing the quadriceps at the top. Hands gripping the side handles. Controlled movement up and down.",

  "Back Squat":
    "Person with a barbell resting on the upper back/traps, hands gripping the bar wide. Squatting down until thighs are at least parallel to the floor. Feet shoulder-width apart, knees tracking over toes, chest up, back straight. Driving up through the heels.",

  "Wall Sit":
    "Person with their back flat against a wall, sliding down until thighs are parallel to the floor. Knees bent at 90 degrees, shins vertical. Arms at sides or crossed on chest. Feet flat on the floor hip-width apart. Isometric hold, back fully in contact with the wall.",

  "Bulgarian Split Squat":
    "Person standing in a split stance with the rear foot elevated on a bench behind them. Front foot flat on the floor about two feet in front of the bench. Lowering the back knee toward the floor while the front knee bends, front knee tracking over the toes. Torso upright, core braced.",

  "Bodyweight Squat":
    "Person standing with feet shoulder-width apart, toes slightly turned out. Squatting down by pushing the hips back and bending the knees until thighs are parallel to the floor or below. Arms extended forward for balance. Chest up, back straight, heels on the ground, knees tracking over toes.",

  "Goblet Squat":
    "Person holding a dumbbell or kettlebell vertically at chest height, close to the body with both hands cupping the top end. Squatting down with elbows tracking inside the knees. Feet shoulder-width apart, chest up, hips below parallel. Upright torso throughout.",

  "Leg Press":
    "Person seated in a leg press machine, back and hips pressed firmly against the seat pad. Feet placed shoulder-width apart on the platform. Pressing the platform away by extending the legs without locking the knees. Or lowering the weight until knees are bent at roughly 90 degrees.",

  "Step Up":
    "Person stepping up onto a sturdy box or bench with one foot flat on the surface. Driving through the front heel to stand up on top of the box, bringing the trailing leg up. Standing tall at the top with both feet on the box. Then stepping back down with control. Upright torso throughout.",

  "Lunge":
    "Person stepping forward into a lunge: front foot flat on the ground, front knee bent at 90 degrees tracking over the toes, back knee lowering toward the floor. Torso upright, core braced, hands on hips or at sides. Both legs forming roughly 90-degree angles at the bottom.",
};

async function main() {
  const exercises = await prisma.exercise.findMany();
  let updated = 0;

  for (const exercise of exercises) {
    const name = (exercise.name as Record<string, string>).en;
    if (!name) continue;

    const prompt = prompts[name];
    if (!prompt) {
      console.log(`⚠ No prompt for: ${name}`);
      continue;
    }

    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { generationPrompt: prompt },
    });
    updated++;
    console.log(`✓ ${name}`);
  }

  console.log(`\nUpdated ${updated}/${exercises.length} exercises`);
  await prisma.$disconnect();
}

main();
