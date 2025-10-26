<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { enhance } from '$app/forms';

	export let issues: Array<{ issue: any; category: any; postedBy: any }>;

	let exportFormat = 'csv';
	let exportType = 'all';
	let showExportDialog = false;

	function generateCSV() {
		const headers = [
			'Issue ID',
			'Title',
			'Description',
			'Status',
			'Category',
			'Department',
			'Location',
			'Reported By',
			'Reported Email',
			'Created Date',
			'Estimated Resolution',
			'Actual Resolution'
		];

		const rows = issues.map(({ issue, category, postedBy }) => [
			issue.id,
			`"${issue.title.replace(/"/g, '""')}"`,
			`"${issue.description.replace(/"/g, '""')}"`,
			issue.status,
			category?.name || '',
			category?.department || '',
			`"${issue.locationAddress.replace(/"/g, '""')}"`,
			postedBy?.name || '',
			postedBy?.email || '',
			new Date(issue.createdAt).toISOString(),
			issue.estimatedResolutionDate ? new Date(issue.estimatedResolutionDate).toISOString() : '',
			issue.actualResolutionDate ? new Date(issue.actualResolutionDate).toISOString() : ''
		]);

		const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
		
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `issues-export-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function generateJSON() {
		const jsonData = issues.map(({ issue, category, postedBy }) => ({
			id: issue.id,
			title: issue.title,
			description: issue.description,
			status: issue.status,
			category: category?.name || '',
			department: category?.department || '',
			location: issue.locationAddress,
			reportedBy: postedBy?.name || '',
			reportedEmail: postedBy?.email || '',
			createdDate: issue.createdAt,
			estimatedResolution: issue.estimatedResolutionDate,
			actualResolution: issue.actualResolutionDate,
			photos: issue.photos || []
		}));

		const jsonContent = JSON.stringify(jsonData, null, 2);
		
		const blob = new Blob([jsonContent], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `issues-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleExport() {
		if (exportFormat === 'csv') {
			generateCSV();
		} else if (exportFormat === 'json') {
			generateJSON();
		}
		showExportDialog = false;
	}
</script>

<Dialog bind:open={showExportDialog}>
	<DialogTrigger>
		<Button variant="outline">
			📊 Export Data
		</Button>
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Export Issues Data</DialogTitle>
			<DialogDescription>
				Export your assigned issues data in various formats
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4">
			<div>
				<label for="export-format" class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
				<Select.Root bind:value={exportFormat}>
					<Select.Trigger>
						<Select.Value placeholder="Select format" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="csv">CSV (Excel compatible)</Select.Item>
						<Select.Item value="json">JSON (Structured data)</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			
			<div>
				<label for="export-type" class="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
				<Select.Root bind:value={exportType}>
					<Select.Trigger>
						<Select.Value placeholder="Select type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All Issues ({issues.length})</Select.Item>
						<Select.Item value="pending">Pending Only</Select.Item>
						<Select.Item value="resolved">Resolved Only</Select.Item>
						<Select.Item value="in_progress">In Progress Only</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<Card>
				<CardHeader>
					<CardTitle class="text-sm">Export Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-sm text-gray-600">
						<p>Format: {exportFormat.toUpperCase()}</p>
						<p>Issues: {issues.length}</p>
						<p>Generated: {new Date().toLocaleString()}</p>
					</div>
				</CardContent>
			</Card>

			<div class="flex justify-end space-x-2">
				<Button variant="outline" onclick={() => showExportDialog = false}>
					Cancel
				</Button>
				<Button onclick={handleExport}>
					Export {issues.length} Issue{issues.length === 1 ? '' : 's'}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>
