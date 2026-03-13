## Description:

A mobile-first web application in spanish for archers to create their profile, manage their bows, schedule archery sessions, keep track of their progress.

## Requirements:

### Admin:

- Manage users.
- Confirm a scheduled session.
  - Add a note for the user (maybe requested is not available at all).
- Send general notifications.
- Decline a scheduled session.
- Add stretching plans.
- Add warm up plans.
- Edit an user session.
- Edit an user log.
- Manage market place

- Preview profiles

### User:

- SSO with Google and Facebook.
- Create a profile. with the following attributes:
- Name
  - Email
  - Password
  - Picture
  - Bow(s)
    - Left / Right
    - Type: Recurve / Compound / Barebow
    - Draw weight.
  - Scope measures.
  - Arrows
    - Brand
    - Millimeters
    - fletchings
    - shaft material
    - Point
- See profile in a baseball card sort of layout.
- [tbd] Book a class.
- Schedule a session. with the following attributes:
  - Date
    - Time
    - Distance
    - Location (Chia or Cervantes)
    - Material booked:
- [ ] Bow (specify type, orientation and draw weight)
- [ ] Arrows
- [ ] karkaj
- [ ] Protection gear
- [ ] Weights
- [ ] Tap
- Notes

- Cancel a session.

- Pay for a session.

- Start a session:
- Auto-saving session details as they are entered.
- AI | Get quick recap of things to work on based on the previous session.
- AI | Get a general advice for the session (based on frequency of training, previous scores and results).
- Score goal ? - Attributes: - Weather (sunny, cloudy, rainy, heavy rain, windy) - Type (control, training, contest) - Distance - Start time - End time - Size of the target - Materials used - Which bow was used. - Which arrows were used. - Anything new on the gear.
  - Physical status.
  - Start a warm up session.
  - Start a stretching session.
  - [tbd] Scale of focus status - Scoresheet image(optional) - Attachments(optional)
- Log a round: - [tbd] Start timer. - Arrows shot
- Add results. Options:

* Add score for each arrow manually.
* Add arrows on a target map.
* [tbd] Import arrow map from picture.
* Count the number of arrows on the 10, X, and/or 9.
  _ Count the number of arrows < to 8.
  _ Counter the number of misses.
* [tbd] No. of grouped arrows. - Import one or more rounds from a scoresheet.
  - Add things to work on / areas of improvements. (this should be a list of some sort).
    - Comment
    - ? Attachment

- ? Instructor
- Final thoughts.

- See a session summary:
  - Total score.
  - Total arrows.
  - Instructor(s)
- chart of score progression over time.
- chart of grouping progression over time.
- Areas to improve.

- See general stats:
- Total number of sessions.
- Total number of arrows shot.
- Average score per session.
- Average grouping per session.

- Start a session that wasn't scheduled.
- Add a post to the market place.

- See marketplace:
  - Buy / Sell bows and accessories.

### Visual Idea: Similar to TCG or baseball player cards, each person has an archer card with their photo, name, bow type, dominant hand, and other relevant information.
