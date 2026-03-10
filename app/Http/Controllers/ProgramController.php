<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProgramController extends Controller
{
    public function index()
    {
        $programs = Program::withCount('alumni')->get();

        return Inertia::render('ProgramCrud', [
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
            ]);

            if ($this->hasConflictingProgramName($validated['name'])) {
                return back()->withErrors(['name' => 'Program name already exists.'])->withInput();
            }

            Program::create($validated);
        } catch (QueryException $e) {
            if ($this->isDuplicateNameConstraintViolation($e)) {
                return back()->withErrors(['name' => 'Program name already exists.'])->withInput();
            }

            throw $e;
        }

        return redirect()->back()->with('success', 'Program added successfully.');
    }

    public function update(Request $request, $id)
    {
        $program = Program::findOrFail($id);
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
            ]);

            if ($this->hasConflictingProgramName($validated['name'], $program->id)) {
                return back()->withErrors(['name' => 'Program name already exists.'])->withInput();
            }

            $program->update($validated);
        } catch (QueryException $e) {
            if ($this->isDuplicateNameConstraintViolation($e)) {
                return back()->withErrors(['name' => 'Program name already exists.'])->withInput();
            }

            throw $e;
        }

        return redirect()->back()->with('success', 'Program updated successfully.');
    }

    public function destroy($id)
    {
        try {
            $program = Program::findOrFail($id);

            if ($program->alumni()->exists()) {
                return redirect()->back()->with('error', 'You cannot delete this program because it has linked alumni records.');
            }

            $program->delete();

            return redirect()->back()->with('success', 'Program deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function create()
    {
        $programs = Program::select('name')->get();

        return Inertia::render('AlumniForm', [
            'programs' => $programs,
        ]);
    }

    private function isDuplicateNameConstraintViolation(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (string) ($e->errorInfo[1] ?? '');

        return in_array($sqlState, ['23000', '23505'], true)
            || in_array($driverCode, ['1062', '1555', '2067', '19'], true);
    }

    private function hasConflictingProgramName(string $name, ?int $ignoreId = null): bool
    {
        $query = Program::query()
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)]);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }
}
