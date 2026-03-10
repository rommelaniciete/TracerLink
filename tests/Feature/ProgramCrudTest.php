<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgramCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_program_name_is_rejected_on_create_with_field_error_even_with_different_case(): void
    {
        $user = User::factory()->create();
        Program::create(['name' => 'Bachelor of Science']);

        $response = $this->actingAs($user)
            ->from('/settings/program')
            ->post('/program', [
                'name' => 'bachelor of science',
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'Program name already exists.',
        ]);
    }

    public function test_duplicate_program_name_is_rejected_on_update_with_field_error_even_with_different_case(): void
    {
        $user = User::factory()->create();
        $existingProgram = Program::create(['name' => 'Bachelor of Science']);
        $programToUpdate = Program::create(['name' => 'Master of Arts']);

        $response = $this->actingAs($user)
            ->from('/settings/program')
            ->put("/program/{$programToUpdate->id}", [
                'name' => strtolower($existingProgram->name),
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors([
            'name' => 'Program name already exists.',
        ]);
    }

    public function test_updating_program_with_its_own_name_succeeds_even_with_case_change(): void
    {
        $user = User::factory()->create();
        $program = Program::create(['name' => 'Bachelor of Science']);

        $response = $this->actingAs($user)
            ->from('/settings/program')
            ->put("/program/{$program->id}", [
                'name' => 'BACHELOR OF SCIENCE',
            ]);

        $response->assertRedirect('/settings/program');
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('programs', [
            'id' => $program->id,
            'name' => 'BACHELOR OF SCIENCE',
        ]);
    }

    public function test_case_insensitive_duplicate_program_name_does_not_create_new_row(): void
    {
        $user = User::factory()->create();
        Program::create(['name' => 'Bachelor of Science']);

        $this->actingAs($user)
            ->from('/settings/program')
            ->post('/program', [
                'name' => 'BACHELOR OF SCIENCE',
            ]);

        $this->assertCount(
            1,
            Program::whereRaw('LOWER(name) = ?', ['bachelor of science'])->get()
        );
    }
}
