<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\{
    SendController,
    StudentController,
    AlumniController,
    ListController,
    DataController,
    JobPostController,
    AlumniFormController,
    UpdateAlumniFormController,
    JobFormController,
    ChartController,
    AlumniExportController,
    UpdateEmailController,
    YesNoController,
    LocationController,
    ProgramController,
    DashboardController,
    PursuingStudiesController,
    TotalGraduatesController,
    AlumniImportController,
    GenderChartController,
    EmployabilityController,
    TestController,
};
use App\Exports\StudentTemplateExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Events\TestEvent;
use Illuminate\Support\Facades\Mail;

// 🌐 Public Welcome Page
// Route::get('/', fn () => Inertia::render('welcome'))->name('home');
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');


Route::get('TestPage', function () {
    return 'capital case is working';
});


// 📝 Public Alumni Form
Route::get('/alumni-form/{student_number}', [AlumniFormController::class, 'show'])->name('alumni.form');
Route::post('/alumni-form/{student_number}/submit', [AlumniFormController::class, 'store'])->name('alumni.store');

// 🔗 Blank Form (Public Link)
Route::get('/alumni-form-link', fn() => Inertia::render('AlumniForm'))->name('alumni.form.link');

// 🔄 Alumni Update via Signed Link
Route::get('/alumni-update-form/{student_number}', [UpdateAlumniFormController::class, 'show'])
    ->middleware('signed')
    ->name('alumni.update.form');
Route::put('/alumni-update-form/{student_number}', [UpdateAlumniFormController::class, 'update'])
    ->name('alumni.update.submit');

// ✅ Email Duplication Check
Route::get('/check-active-email', [AlumniFormController::class, 'checkActiveEmail'])->name('alumni.email.check');

// 📊 Public Charts and Export
Route::get('/alumni-chart', [ChartController::class, 'alumniPie'])->name('alumni.chart');
Route::get('/alumni-chart-options', [ChartController::class, 'options'])->name('alumni.chart.options');
Route::get('/related', [YesNoController::class, 'YesNo'])->name('related.chart');
Route::get('/location', [LocationController::class, 'location'])->name('location.chart');
Route::post('/export-alumni', [AlumniExportController::class, 'export'])->name('alumni.export');

// 📈 New Analytics Charts
Route::get('/chart/pursuing-studies', [PursuingStudiesController::class, 'chart'])->name('chart.pursuing.studies');
Route::get('/chart/total-graduates', [TotalGraduatesController::class, 'total'])->name('chart.total.graduates');

// 👨‍👩‍👧 Gender Chart (FIXED ✅)
Route::get('/chart/gender', [GenderChartController::class, 'genderData'])->name('chart.gender');

// 🧪 Test Email Blade Preview
Route::get('/test-email-view', fn() => view('emails.AlumniUpdateForm', [
    'student' => (object)[
        'student_number' => '2023-00001',
        'given_name' => 'Juan',
    ],
    'formUrl' => url('/alumni-update-form/2023-00001'),
]))->name('test.email.view');

// ✅ Public Job Form Link (from email)
Route::get('/job-form/{alumni}', [JobFormController::class, 'show'])->name('job-form.show');

// 🔐 Admin-Only Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {

    // 📊 Dashboard Page
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/program-counts', [DashboardController::class, 'programCounts'])->name('dashboard.program.counts');
    Route::get('/about', fn() => Inertia::render('about'))->name('about');

    // 📧 Email Sending
    Route::post('/send-email', [SendController::class, 'sendEmail'])->name('email.send');
    Route::post('/send-email-to-alumni', [SendController::class, 'sendToProgram'])->name('email.to.program');
    Route::post('/send-email-to-all-alumni', [UpdateEmailController::class, 'sendToAll'])->name('email.to.all.alumni');
    Route::post('/send-email-to-selected-alumni', [UpdateEmailController::class, 'sendToSelected']);

    // 👨‍🎓 Alumni CRUD
    Route::get('/alumni-data', [AlumniController::class, 'index'])->name('alumni.index');
    Route::post('/alumni', [AlumniController::class, 'store'])->name('alumni.store');
    Route::put('/alumni/{id}', [AlumniController::class, 'update'])->name('alumni.update');
    Route::delete('/alumni/{id}', [AlumniController::class, 'destroy'])->name('alumni.destroy');

    // 👩‍🎓 Student CRUD
    Route::get('/students', [StudentController::class, 'index'])->name('students.index');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::put('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::delete('/students/{student}', [StudentController::class, 'destroy'])->name('students.destroy');
    Route::post('/students/export', [StudentController::class, 'export'])->name('students.export');

    // ✅ API Route for Dynamic Programs Dropdown
    Route::get('/students/programs', [StudentController::class, 'programList'])->name('students.programs');

    // 📦 Resource Controllers
    Route::resource('/send', SendController::class)->only(['index', 'create', 'store']);
    Route::resource('/list', ListController::class);
    Route::resource('/data', DataController::class);
    Route::resource('/jobpost', JobPostController::class);
    Route::resource('/program', ProgramController::class);
    Route::resource('/test', TestController::class);

    // 👈 Employability Route ✅
    Route::get('/employability', [EmployabilityController::class, 'index'])->name('employability.index');
    Route::post('/employability/export', [EmployabilityController::class, 'export'])->name('employability.export');

    // 🧠 API for Frontend Fetching
    Route::get('/alumni-form', [ProgramController::class, 'create']);
    Route::get('/alumni/create', [AlumniController::class, 'create']);
    Route::get('/api/programs', fn() => \App\Models\Program::select('id', 'name')->orderBy('name')->get());

    // ✅ Import Alumni (main + alias para sa React)
    Route::post('/alumni/import', [AlumniImportController::class, 'import'])->name('alumni.import');
    Route::post('/import-alumni', [AlumniImportController::class, 'import'])->name('alumni.import.alias');
});

// 📍 Job Posts
Route::get('/job-posts', [JobPostController::class, 'index'])->name('job-posts.index');
Route::post('/job-posts', [JobPostController::class, 'store'])->name('job-posts.store');
Route::put('/job-posts/{job_post}', [JobPostController::class, 'update'])->name('job-posts.update');
Route::delete('/job-posts/{job_post}', [JobPostController::class, 'destroy'])->name('job-posts.destroy');

// ✅ Send email to unemployed alumni by program
Route::post('/job-posts/send-email', [JobPostController::class, 'sendEmail'])->name('job-posts.send-email');

// ✅ Send email to all employed alumni (NEW)
Route::post('/job-posts/send-email-to-all-employed', [JobPostController::class, 'sendEmailToAllEmployed'])->name('job-posts.send-email-to-all-employed');

// ✅ Bulk delete students
Route::post('/students/bulk-delete', [StudentController::class, 'bulkDelete']);

// ✅ Import students from Excel
Route::post('/students/import', [StudentController::class, 'import'])->name('students.import');

// ✅ Send email to selected students
Route::post('/students/send-email', [SendController::class, 'sendEmail'])->name('students.send-email');
Route::post('/alumni/bulk-delete', [AlumniController::class, 'bulkDelete'])->name('alumni.bulk-delete');


// ⚙️ Program setting page
Route::get('/settings/program', function () {
    $programs = \App\Models\Program::all();
    return Inertia::render('settings/ProgramCrud', [
        'programs' => $programs,
    ]);
});

Route::get('/test-realtime', function () {
    event(new \App\Events\TestRealtime('Hello from Laravel!'));
    return 'Event fired!';
});
Route::post('/alumni', [AlumniController::class, 'store']);


// routes/web.php or routes/api.php
Route::get('/test-broadcast', function () {
    $alumni = App\Models\Alumni::first(); // Get any alumni
    event(new App\Events\AlumniCreated($alumni));
    return 'Event broadcasted!';
});

Route::get('/api/programs', function () {
    return response()->json(\App\Models\Program::all());
});

Route::get('/programs', function () {
    return \App\Models\Program::select('id', 'name')->orderBy('name')->get();
});

Route::get('/alumni/template/download', [AlumniController::class, 'downloadTemplate'])
    ->name('alumni.template.download');



Route::get('/students/download-template', function () {
    return Excel::download(new StudentTemplateExport, 'student_template.xlsx');
})->name('students.download-template');


// 🧩 Include extra route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
