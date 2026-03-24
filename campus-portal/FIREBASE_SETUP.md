# Firebase Setup Guide - Domain-Based Role Access

## 1. Firestore Rules Deployment

Copy the rules from `firestore.rules` to your Firebase Console:
1. Go to Firebase Console → Firestore → Rules
2. Replace with content from `firestore.rules`
3. Click "Publish"

## 2. Required Firestore Document Structure

### Admin Collection
**Path:** `artifacts/{projectId}/public/data/admins/{uid}`

```json
{
  "id": "firebase_uid",
  "name": "Super Administrator",
  "email": "admin@admin.com",
  "role": "admin",
  "createdAt": "2026-03-25T00:00:00Z"
}
```

### Teacher Collection
**Path:** `artifacts/{projectId}/public/data/teachers/{uid}`

```json
{
  "id": "firebase_uid",
  "name": "Prof. John Doe",
  "email": "john@teacher.com",
  "role": "teacher",
  "department": "Computer Science",
  "sections": ["A", "B"],
  "createdAt": "2026-03-25T00:00:00Z"
}
```

### Student Collection
**Path:** `artifacts/{projectId}/public/data/students/{uid}`

```json
{
  "id": "firebase_uid",
  "name": "Alice Smith",
  "email": "alice@student.com",
  "role": "student",
  "rollNo": "CS-2024-001",
  "section": "A",
  "personalDetails": {
    "phone": "+1 234 567 8900",
    "parentPhone": "+1 234 567 8999",
    "address": "123 Campus Drive",
    "dob": "2004-05-14"
  },
  "collegeDetails": {
    "course": "B.Tech",
    "branch": "Computer Science",
    "year": "2nd Year",
    "semester": "4th"
  },
  "createdAt": "2026-03-25T00:00:00Z"
}
```

### Attendance Records (Sub-collection)
**Path:** `artifacts/{projectId}/public/data/students/{uid}/attendance/{docId}`

OR

**Path:** `artifacts/{projectId}/public/data/teachers/{uid}/attendance/{docId}`

```json
{
  "date": "2026-03-25",
  "subject": "Data Structures",
  "status": "Present",
  "time": "09:00 AM",
  "markedBy": "teacher_uid",
  "timestamp": "2026-03-25T09:15:00Z"
}
```

## 3. Domain-Based Permissions Summary

### Admin (@admin.com)
- ✅ Read all admins, teachers, students
- ✅ Create/update/delete teachers
- ✅ Create/update/delete students
- ✅ Create/update/delete attendance records
- ✅ Auto-sync to all panels within 5 seconds

### Teacher (@teacher.com)
- ✅ Read all students and other teachers
- ✅ Write attendance records for students
- ✅ Read all attendance data
- ❌ Cannot modify student/teacher profiles
- ✅ Changes sync to student/admin panels within 5 seconds

### Student (@student.com)
- ✅ Read own student profile
- ✅ Read own attendance records
- ✅ Read own results
- ✅ Read all teachers (to see faculty)
- ❌ Cannot write any data
- ✅ Sees real-time updates within 5 seconds

## 4. Firebase Auth Setup

Create users in Firebase Console → Authentication:

### Example Users

**Admin:**
- Email: `public@admin.com`
- Password: any secure password
- Domain: @admin.com ✓

**Teacher:**
- Email: `john@teacher.com`
- Password: any secure password
- Domain: @teacher.com ✓

**Student:**
- Email: `alice@student.com`
- Password: any secure password
- Domain: @student.com ✓

## 5. Real-time Sync (5 Second Updates)

The app uses Firestore `onSnapshot()` listeners which:
- Automatically listen to changes
- Update UI within milliseconds of Firestore write
- No manual refresh needed
- Full offline support with local caching

### Real-time Flow:
1. Teacher writes attendance → Firestore
2. Listener detects change
3. `appData` state updates
4. All panels re-render
5. Student/Admin see update instantly

## 6. Troubleshooting

### Error: "Permission denied"
- ✓ Check email domain matches (@admin.com, @teacher.com, @student.com)
- ✓ Ensure Firebase Auth user exists
- ✓ Verify Firestore rules are published
- ✓ Check user is authenticated: `console.log(auth.currentUser)`

### Error: "Document not found"
- Create the user document in Firestore (registration handles this)
- OR use Firebase Console to manually create document

### Data not updating in real-time
- Check browser console for listener errors
- Verify user has read permission for collection
- Check network tab for Firestore requests

## 7. API Endpoints Used

```javascript
// Registration creates document:
setDoc(doc(firestore, 'artifacts', appId, 'public', 'data', 'admins', uid), data)

// Listeners watch for changes:
onSnapshot(collection(firestore, 'artifacts', appId, 'public', 'data', 'students'), callback)

// Role-based access auto-assigned:
if (email.endsWith('@admin.com')) → role = 'admin'
if (email.endsWith('@teacher.com')) → role = 'teacher'
else → role = 'student'
```

## 8. Advanced: Custom Claims (Optional)

For stronger security, set custom claims in Firebase Auth:
```javascript
admin.auth().setCustomUserClaims(uid, {
  role: 'admin',
  domain: 'admin.com'
})
```

Then verify in rules:
```
allow read: if request.auth.token.role == 'admin'
```

---

**Status:** ✅ Ready for production with domain-based role enforcement
