#  Copyright 2022 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

"""
Test Bigquery connector with CLI
"""
import random
from typing import List, Tuple

from metadata.data_quality.api.models import TestCaseDefinition
from metadata.generated.schema.entity.data.table import (
    DmlOperationType,
    ProfileSampleType,
    SystemProfile,
    TableProfilerConfig,
)
from metadata.generated.schema.tests.basic import TestCaseResult, TestCaseStatus
from metadata.generated.schema.tests.testCase import TestCaseParameterValue
from metadata.generated.schema.type.basic import Timestamp

from .common.test_cli_db import CliCommonDB
from .common_e2e_sqa_mixins import SQACommonMethods


class BigqueryCliTest(CliCommonDB.TestSuite, SQACommonMethods):
    create_table_query: str = """
        CREATE TABLE `open-metadata-beta.exclude_me`.orders (
            id int,
            order_name string
        )
    """

    create_view_query: str = """
       CREATE VIEW `open-metadata-beta.exclude_me.view_orders` AS
                     SELECT orders.id as id, orders.order_name as order_name
                       FROM `open-metadata-beta`.exclude_me.orders;
    """

    insert_data_queries: List[str] = [
        (
            "INSERT INTO `open-metadata-beta.exclude_me`.orders (id, order_name) VALUES "
            + ",".join(
                [
                    "(" + ",".join(values) + ")"
                    for values in [
                        (
                            str(i),
                            random.choice(["'PS'", "'XBOX'", "'NINTENDO'", "'SEGA'"]),
                        )
                        for i in range(1000)
                    ]
                ]
            )
            + ";"
        ),
        "UPDATE `open-metadata-beta.exclude_me`.orders SET order_name = 'NINTENDO' WHERE id = 2",
    ]

    drop_table_query: str = """
        DROP TABLE IF EXISTS `open-metadata-beta.exclude_me`.orders;
    """

    drop_view_query: str = """
        DROP VIEW  IF EXISTS `open-metadata-beta.exclude_me`.view_orders;
    """

    def create_table_and_view(self) -> None:
        SQACommonMethods.create_table_and_view(self)

    def delete_table_and_view(self) -> None:
        SQACommonMethods.delete_table_and_view(self)

    def delete_table_rows(self) -> None:
        SQACommonMethods.run_delete_queries(self)

    def update_table_row(self) -> None:
        SQACommonMethods.run_update_queries(self)

    @staticmethod
    def get_connector_name() -> str:
        return "bigquery"

    @staticmethod
    def expected_tables() -> int:
        return 2

    def inserted_rows_count(self) -> int:
        return len(self.insert_data_queries)

    def view_column_lineage_count(self) -> int:
        return 2

    def expected_lineage_node(self) -> str:
        return "local_bigquery.open-metadata-beta.exclude_me.view_orders"

    @staticmethod
    def _expected_profiled_tables() -> int:
        return 2

    @staticmethod
    def fqn_created_table() -> str:
        return "local_bigquery.open-metadata-beta.exclude_me.orders"

    @staticmethod
    def get_includes_schemas() -> List[str]:
        return ["exclude_me"]

    @staticmethod
    def get_includes_tables() -> List[str]:
        return ["exclude_table"]

    @staticmethod
    def get_excludes_tables() -> List[str]:
        return ["testtable"]

    @staticmethod
    def expected_filtered_schema_includes() -> int:
        return 1

    @staticmethod
    def expected_filtered_schema_excludes() -> int:
        return 1

    @staticmethod
    def expected_filtered_table_includes() -> int:
        return 1

    @staticmethod
    def expected_filtered_table_excludes() -> int:
        return 1

    @staticmethod
    def expected_filtered_mix() -> int:
        return 1

    @staticmethod
    def delete_queries() -> List[str]:
        return [
            """
            DELETE FROM `open-metadata-beta.exclude_me`.orders WHERE id IN (1)
            """,
        ]

    @staticmethod
    def update_queries() -> List[str]:
        return [
            """
            UPDATE `open-metadata-beta.exclude_me`.orders SET order_name = 'NINTENDO' WHERE id = 2
            """,
        ]

    def get_system_profile_cases(self) -> List[Tuple[str, List[SystemProfile]]]:
        return [
            (
                "local_bigquery.open-metadata-beta.exclude_me.orders",
                [
                    SystemProfile(
                        timestamp=Timestamp(root=0),
                        operation=DmlOperationType.INSERT,
                        rowsAffected=2,
                    ),
                    SystemProfile(
                        timestamp=Timestamp(root=1),
                        operation=DmlOperationType.UPDATE,
                        rowsAffected=1,
                    ),
                ],
            )
        ]

    def add_table_profile_config(self):
        self.openmetadata.create_or_update_table_profiler_config(
            self.get_data_quality_table(),
            TableProfilerConfig(
                profileSampleType=ProfileSampleType.ROWS,
                profileSample=100,
            ),
        )

    def get_data_quality_table(self):
        return self.fqn_created_table()

    def get_test_case_definitions(self) -> List[TestCaseDefinition]:
        return [
            TestCaseDefinition(
                name="bigquery_data_diff",
                testDefinitionName="tableDiff",
                computePassedFailedRowCount=True,
                parameterValues=[
                    TestCaseParameterValue(
                        name="table2",
                        value=self.get_data_quality_table(),
                    ),
                    TestCaseParameterValue(
                        name="keyColumns",
                        value='["id"]',
                    ),
                ],
            )
        ]

    def get_expected_test_case_results(self):
        return [TestCaseResult(testCaseStatus=TestCaseStatus.Success, timestamp=0)]
