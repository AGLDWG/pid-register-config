# Prez reference-data overrides

The endpoint definition configures the three-level catalogue hierarchy in `pid-register-data`. Models, Organisations, PIDs and Validators are the only root catalogues. Their directly included resources appear at level two; PID records appear as level-three items beneath the four PID subcatalogues. The custom open-object profile hides structural `schema:hasPart` and `olis:includes` predicates from metadata without transforming the source data.
