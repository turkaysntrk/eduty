<template>
	<div class="page-wrapper">
		<div class="page-header">
			<h1>SCHEDULE</h1>
		</div>

		<div class="schedule-container">
			<div class="timeline">

				<div class="day-header">1st Day</div>

				<div class="event-row">
					<div class="time">09.00 - 10.00</div>
					<div class="event-details">
						<h3>Registration</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">10.00 - 11.00</div>
					<div class="event-details">
						<h3>Opening Ceremony</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">11.00 - 12.00</div>
					<div class="event-details">
						<h3>1st Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">12.00 - 12.30</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">12.30 - 13.30</div>
					<div class="event-details">
						<h3>2nd Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">13.30 - 14.30</div>
					<div class="event-details">
						<h3>Lunch</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">14.30 - 16.00</div>
					<div class="event-details">
						<h3>3rd Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">16.00 - 16.30</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">16.30 - 18.00</div>
					<div class="event-details">
						<h3>4th Session</h3>
					</div>
				</div>


				<div class="day-header" style="margin-top: 50px;">2nd Day</div>

				<div class="event-row">
					<div class="time">10.00 - 11.30</div>
					<div class="event-details">
						<h3>5th Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">11.30 - 12.00</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">12.00 - 13.30</div>
					<div class="event-details">
						<h3>6th Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">13.30 - 14.30</div>
					<div class="event-details">
						<h3>Lunch</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">14.30 - 16.00</div>
					<div class="event-details">
						<h3>7th Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">16.00 - 16.30</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">16.30 - 18.00</div>
					<div class="event-details">
						<h3>8th Session</h3>
					</div>
				</div>


				<div class="day-header" style="margin-top: 50px;">3rd Day</div>

				<div class="event-row">
					<div class="time">10.00 - 11.30</div>
					<div class="event-details">
						<h3>9th Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">11.30 - 12.00</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">12.00 - 13.30</div>
					<div class="event-details">
						<h3>10th Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">13.30 - 14.30</div>
					<div class="event-details">
						<h3>Lunch</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">14.30 - 16.00</div>
					<div class="event-details">
						<h3>11st Session</h3>
					</div>
				</div>

				<div class="event-row break-row">
					<div class="time">16.00 - 16.30</div>
					<div class="event-details">
						<h3>Coffee Break</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">16.30 - 17.30</div>
					<div class="event-details">
						<h3>12nd Session</h3>
					</div>
				</div>

				<div class="event-row">
					<div class="time">17.30 - 18.30</div>
					<div class="event-details">
						<h3>Closing Ceremony</h3>
					</div>
				</div>

			</div>
		</div>
	</div>
</template>

<style scoped="">
	.page-wrapper {
	padding-top: 100px;
	min-height: 80vh;
	}
	.page-header {
	text-align: center;
	margin-bottom: 50px;
	}

	.schedule-container {
	max-width: 800px;
	margin: 0 auto;
	padding: 20px;
	}

	.day-header {
	font-size: 1.5rem;
	color: #b91c1c;
	border-bottom: 1px solid #333;
	padding-bottom: 10px;
	margin-bottom: 20px;
	font-weight: bold;
	}

	.event-row {
	display: flex;
	align-items: center;
	padding: 15px 0;
	border-bottom: 1px solid #1a1a1a;
	}

	/* Molaları biraz daha soluk yaparak hiyerarşi sağladım */
	.break-row {
	opacity: 0.6;
	}

	.event-row:last-child {
	border-bottom: none;
	}

	.time {
	width: 140px; /* Saati biraz genişlettim */
	font-size: 1.1rem;
	font-weight: bold;
	color: white;
	flex-shrink: 0;
	}

	.event-details h3 {
	margin: 0;
	font-size: 1.1rem;
	color: #ddd;
	}

	.event-details span {
	color: #666;
	font-size: 0.9rem;
	display: block; /* Alt satıra geçmesi için */
	margin-top: 4px;
	}

	/* Mobil uyumluluk için küçük bir ekleme */
	@media (max-width: 600px) {
	.event-row {
	flex-direction: column;
	align-items: flex-start;
	}
	.time {
	margin-bottom: 5px;
	color: #b91c1c; /* Mobilde saati kırmızı yaparak ayıralım */
	font-size: 1rem;
	}
	}
</style>