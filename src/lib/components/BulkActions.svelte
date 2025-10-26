<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { enhance } from '$app/forms';

	export let selectedIssues: string[] = [];
	export let allIssues: Array<{ issue: { id: string; title: string; status: string } }>;
	export let onSelectionChange: (issues: string[]) => void;

	let showBulkDialog = false;
	let bulkStatus = '';
	let bulkComment = '';
	let isSubmitting = false;

	// Computed properties
	$: selectedCount = selectedIssues.length;
	$: canSelectAll = allIssues.length > 0;
	$: isAllSelected = selectedIssues.length === allIssues.length;
	$: isIndeterminate = selectedIssues.length > 0 && selectedIssues.length < allIssues.length;

	function toggleSelectAll() {
		if (isAllSelected) {
			onSelectionChange([]);
		} else {
			onSelectionChange(allIssues.map(i => i.issue.id));
		}
	}

	function toggleIssue(issueId: string) {
		if (selectedIssues.includes(issueId)) {
			onSelectionChange(selectedIssues.filter(id => id !== issueId));
		} else {
			onSelectionChange([...selectedIssues, issueId]);
		}
	}

	function handleBulkUpdate() {
		// This will be handled by the parent component
		showBulkDialog = false;
		bulkStatus = '';
		bulkComment = '';
	}
</script>

{#if selectedCount > 0}
	<Card class="mb-6 border-blue-200 bg-blue-50">
		<CardContent class="p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="text-sm font-medium text-blue-900">
						{selectedCount} issue{selectedCount === 1 ? '' : 's'} selected
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={() => onSelectionChange([])}
					>
						Clear Selection
					</Button>
				</div>
				<div class="flex items-center space-x-2">
					<Dialog bind:open={showBulkDialog}>
						<DialogTrigger>
							<Button size="sm">
								Bulk Update Status
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Bulk Update Status</DialogTitle>
								<DialogDescription>
									Update the status of {selectedCount} selected issue{selectedCount === 1 ? '' : 's'}
								</DialogDescription>
							</DialogHeader>
							<form method="POST" action="/authority/bulk-update" use:enhance onsubmit={() => { isSubmitting = true; }}>
								<div class="space-y-4">
									<input type="hidden" name="issueIds" value={selectedIssues.join(',')} />
									<div>
										<label for="bulk-status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
										<Select.Root name="status" type="single">
											<Select.Trigger>
												<Select.Value placeholder="Select status" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="in_progress">In Progress</Select.Item>
												<Select.Item value="resolved">Resolved</Select.Item>
												<Select.Item value="fake">Mark as Fake</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
									<div>
										<label for="bulk-comment" class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
										<Textarea
											name="comment"
											placeholder="Add a comment for all selected issues..."
											rows={3}
											bind:value={bulkComment}
										/>
									</div>
									<div class="flex justify-end space-x-2">
										<Button type="button" variant="outline" onclick={() => showBulkDialog = false} disabled={isSubmitting}>
											Cancel
										</Button>
										<Button type="submit" disabled={isSubmitting}>
											{#if isSubmitting}
												<div class="flex items-center">
													<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
													Updating...
												</div>
											{:else}
												Update {selectedCount} Issue{selectedCount === 1 ? '' : 's'}
											{/if}
										</Button>
									</div>
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</CardContent>
	</Card>
{/if}

<!-- Select All Checkbox -->
<div class="mb-4">
	<label class="flex items-center space-x-2 cursor-pointer">
		<Checkbox 
			checked={isAllSelected}
			indeterminate={isIndeterminate}
			onCheckedChange={toggleSelectAll}
			disabled={!canSelectAll}
		/>
		<span class="text-sm font-medium text-gray-700">
			{isAllSelected ? 'Deselect All' : 'Select All'} ({allIssues.length} issues)
		</span>
	</label>
</div>
