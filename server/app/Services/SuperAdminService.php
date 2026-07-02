<?php

namespace App\Services;

use App\Models\User;
use App\Models\Work;
use App\Models\Chapter;
use App\Repositories\SuperAdminRepository;

class SuperAdminService
{
    public function __construct(private SuperAdminRepository $repo) {}

    public function getDashboard(): array
    {
        return $this->repo->getStats();
    }

    public function getAllUsers(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repo->getAllUsers();
    }

    public function getUserWithWorks(User $user): User
    {
        return $this->repo->getUserWithWorks($user);
    }

    public function banUser(string $adminId, User $user): User
    {
        $result = $this->repo->banUser($user);
        $this->repo->log($adminId, 'banned_user', 'user', $user->id);
        return $result;
    }

    public function unbanUser(string $adminId, User $user): array
    {
        $result = $this->repo->unbanUser($user);
        $this->repo->log($adminId, 'unbanned_user', 'user', $user->id, 'Strike count reset to 0.');
        return ['message' => 'User unbanned and strike count reset.', 'user' => $result];
    }

    public function deleteUser(string $adminId, User $user): void
    {
        $this->repo->log($adminId, 'deleted_user', 'user', $user->id);
        $this->repo->deleteUser($user);
    }

    public function deleteWork(string $adminId, Work $work, ?string $notes = null): void
    {
        $this->repo->log($adminId, 'deleted_work', 'work', $work->id, $notes);
        $this->repo->deleteWork($work);
    }

    public function viewChapter(string $adminId, Chapter $chapter): Chapter
    {
        $this->repo->log($adminId, 'viewed_chapter', 'chapter', $chapter->id);
        return $this->repo->getChapter($chapter);
    }

    public function deleteChapter(string $adminId, Chapter $chapter, ?string $notes = null): void
    {
        $this->repo->log($adminId, 'deleted_chapter', 'chapter', $chapter->id, $notes);
        $this->repo->deleteChapter($chapter);
    }

  public function getLogs(int $page = 1): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->repo->getLogs($page);
    }
}